import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, type FieldErrors, type Resolver, type ResolverResult } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAuthMe, updateProfile, uploadAvatar } from '@/services/client/profile.client';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/loading';
import {
  formatDateToLocaleString,
  getDateOnly,
  isAtLeastAge,
  normalizeText,
  parseDateOnly,
  toDateOnlyString
} from '@/utils';
import { useNavigate } from 'react-router';
import { User2Icon } from 'lucide-react';
import { toast } from 'react-toastify';
import { UpdateProfileFormSchema, type UpdateProfileData } from '@/models/profile.model';

const AVATAR_EXTENSIONS = new Set(['image/png', 'image/jpeg', 'image/jpg']);
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const PHONE_PREFIX = '+84';
const PHONE_PREFIX_DIGITS = '84';

function normalizePhoneDigits(value: string | null | undefined) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  let next = digits;

  if (next.startsWith(PHONE_PREFIX_DIGITS)) {
    const hasPrefix = value.trim().startsWith('+') || next.length > 9;
    if (hasPrefix) {
      next = next.slice(PHONE_PREFIX_DIGITS.length);
    }
  }

  if (next.startsWith('0')) {
    next = next.slice(1);
  }

  return next.slice(0, 13);
}

function toPhonePayload(digits: string) {
  return digits ? `${PHONE_PREFIX}${digits}` : null;
}

export default function UserSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dirtyFieldsRef = useRef<Partial<Record<keyof UpdateProfileData, boolean>>>({});

  const baseResolver = useMemo(() => zodResolver(UpdateProfileFormSchema), []);
  const resolver: Resolver<UpdateProfileData> = useCallback(
    async (values, context, options) => {
      const result = await baseResolver(values, context, options);
      const dirtyFields = dirtyFieldsRef.current;
      const filteredErrors = Object.fromEntries(
        Object.entries(result.errors).filter(([key]) => dirtyFields[key as keyof UpdateProfileData])
      ) as FieldErrors<UpdateProfileData>;
      const hasErrors = Object.keys(filteredErrors).length > 0;

      if (hasErrors) {
        return {
          values: {},
          errors: filteredErrors
        };
      }

      const resolvedValues: UpdateProfileData =
        Object.keys(result.values).length > 0 ? (result.values as UpdateProfileData) : values;

      const success: ResolverResult<UpdateProfileData> = {
        values: resolvedValues,
        errors: {}
      };

      return success;
    },
    [baseResolver]
  );

  const originalRef = useRef<{
    fullName: string;
    phoneNumber: string;
    address: string;
    birthday: string | null;
  } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, dirtyFields }
  } = useForm<UpdateProfileData>({
    resolver,
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      address: '',
      birthday: undefined
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    dirtyFieldsRef.current = dirtyFields;
  }, [dirtyFields]);

  // Fetch profile data
  const {
    data: profile,
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ['auth-me-profile'],
    queryFn: () => fetchAuthMe(),
    select: (data) => data.value
  });

  // Reset form when profile loads and store original values for comparison
  useEffect(() => {
    if (profile) {
      const birthdayDateOnly = getDateOnly(profile.birthday);
      const normalizedPhone = normalizePhoneDigits(profile.phoneNumber);
      const vals = {
        fullName: profile.fullName || '',
        phoneNumber: normalizedPhone,
        address: profile.address || '',
        birthday: birthdayDateOnly
      } as UpdateProfileData;
      reset(vals);
      originalRef.current = {
        fullName: profile.fullName || '',
        phoneNumber: normalizedPhone,
        address: profile.address || '',
        birthday: birthdayDateOnly ?? null
      };
    }
  }, [profile, reset]);

  // Update profile mutation
  const { isPending: isSaving, mutate: updateMutation } = useMutation({
    mutationFn: (data: Parameters<typeof updateProfile>[0]) => updateProfile(data),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['auth-me-profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error('Failed to update profile');
    }
  });

  // Upload avatar mutation
  const { mutate: uploadAvatarMutation } = useMutation({
    mutationFn: (file: File) => {
      return uploadAvatar(file);
    },
    onSuccess: () => {
      toast.success('Avatar uploaded successfully!');
      // Refetch profile to get updated avatar
      queryClient.refetchQueries({ queryKey: ['auth-me-profile'] });
    },
    onError: (error: any) => {
      console.error(error);
      // setAvatarFile(null);
      toast.error('Failed to upload avatar');
    }
  });

  // Form submission
  const onSubmit = (values: UpdateProfileData) => {
    const changed: Record<string, any> = {};
    const orig = originalRef.current;
    if (!orig) return;
    const fullNameValue = normalizeText(values.fullName);
    const phoneDigits = normalizePhoneDigits(values.phoneNumber);
    const addressValue = normalizeText(values.address);
    const birthdayValue = values.birthday ?? null;

    if (fullNameValue !== normalizeText(orig.fullName)) changed.fullName = fullNameValue || null;
    if (phoneDigits !== normalizePhoneDigits(orig.phoneNumber)) changed.phoneNumber = toPhonePayload(phoneDigits);
    if (addressValue !== normalizeText(orig.address)) changed.address = addressValue || null;
    if (birthdayValue !== orig.birthday) changed.birthday = birthdayValue;

    if (Object.keys(changed).length === 0) {
      toast.info('No changes to save');
      return;
    }

    updateMutation(changed);
  };

  // Avatar upload
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!AVATAR_EXTENSIONS.has(f.type)) {
      toast.error('Invalid file type. Only PNG, JPG, and JPEG allowed');
      e.currentTarget.value = '';
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Max 15 MB');
      e.currentTarget.value = '';
      return;
    }
    // setAvatarFile(f);
    uploadAvatarMutation(f);
  };

  // Watch form values and determine if anything changed compared to originalRef
  useEffect(() => {
    const subscription = watch((values) => {
      const orig = originalRef.current;
      if (!orig) {
        setHasChanges(false);
        return;
      }

      const fullNameChanged = normalizeText(values.fullName) !== normalizeText(orig.fullName);
      const phoneChanged = normalizePhoneDigits(values.phoneNumber) !== normalizePhoneDigits(orig.phoneNumber);
      const addressChanged = normalizeText(values.address) !== normalizeText(orig.address);
      const birthdayChanged = (values.birthday ?? null) !== orig.birthday;

      setHasChanges(fullNameChanged || phoneChanged || addressChanged || birthdayChanged);
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  if (isLoading) {
    return <Loader />;
  }

  if (queryError) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <p className='text-red-500'>An error occurred while loading your profile.</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen py-8 px-6'>
      {/* Header */}
      <div className='mb-10'>
        <div className='flex items-center gap-3 mb-2'>
          <div className='w-10 h-10 rounded-xl bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center'>
            <User2Icon className='w-5 h-5 text-white' />
          </div>
          <h1 className='text-2xl font-bold text-white'>Your Profile</h1>
        </div>
        <p className='text-slate-400 ml-13'>Manage your account information and personal details.</p>
      </div>

      {profile && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Personal Information (2/3) */}
          <div className='lg:col-span-2 bg-neutral-800/50 rounded-lg border border-gray-800 p-6'>
            <div className='mb-6'>
              <h2 className='text-xl font-semibold mb-4 text-white'>Personal Information</h2>

              <div className='flex flex-col items-center gap-3 mb-6'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/png, image/jpeg'
                  className='hidden'
                  onChange={handleOnChange}
                />

                <div className='flex flex-col items-center'>
                  <Avatar key={profile?.avatarPresignedUrl ?? 'fallback'} className='h-20 w-20'>
                    {profile?.avatarPresignedUrl ? (
                      <AvatarImage
                        key={profile.avatarPresignedUrl}
                        src={profile.avatarPresignedUrl}
                        alt='User Avatar'
                        className='h-20 w-20 rounded-full object-cover'
                      />
                    ) : (
                      <AvatarFallback className='bg-linear-to-br from-purple-500 to-pink-500 text-white text-xl font-bold'>
                        {profile?.username ? profile.username.charAt(0).toUpperCase() : ''}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className='mt-3'>
                    <Button
                      type='button'
                      variant={'default'}
                      size={'sm'}
                      onClick={() => fileInputRef.current?.click()}
                      className='rounded-md bg-neutral-700/30 px-3 py-1 text-sm text-white hover:bg-neutral-700/40'
                    >
                      Change avatar
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <label htmlFor='fullName' className='block text-sm font-medium mb-2 text-gray-300'>
                    Full Name
                  </label>
                  <Input
                    id='fullName'
                    type='text'
                    placeholder='Enter your full name'
                    aria-invalid={Boolean(dirtyFields.fullName && errors.fullName)}
                    className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                    {...register('fullName')}
                  />
                  {dirtyFields.fullName && errors.fullName?.message && (
                    <p className='text-xs text-rose-400'>{errors.fullName.message}</p>
                  )}
                </div>

                <div className='space-y-1'>
                  <label htmlFor='phoneNumber' className='block text-sm font-medium mb-2 text-gray-300'>
                    Phone Number
                  </label>
                  <Controller
                    control={control}
                    name='phoneNumber'
                    render={({ field }) => (
                      <div className='relative'>
                        <span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 select-none'>
                          {PHONE_PREFIX}
                        </span>
                        <Input
                          id='phoneNumber'
                          type='tel'
                          inputMode='numeric'
                          autoComplete='tel'
                          placeholder='Enter your phone number'
                          maxLength={13}
                          aria-invalid={Boolean(dirtyFields.phoneNumber && errors.phoneNumber)}
                          className='pl-12 text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                          value={field.value ?? ''}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const normalized = normalizePhoneDigits(e.target.value);
                            field.onChange(normalized);
                          }}
                        />
                      </div>
                    )}
                  />
                  {dirtyFields.phoneNumber && errors.phoneNumber?.message && (
                    <p className='text-xs text-rose-400'>{errors.phoneNumber.message}</p>
                  )}
                </div>

                <div className='space-y-1'>
                  <label htmlFor='address' className='block text-sm font-medium mb-2 text-gray-300'>
                    Address
                  </label>
                  <Input
                    id='address'
                    type='text'
                    placeholder='Enter your address'
                    aria-invalid={Boolean(dirtyFields.address && errors.address)}
                    className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                    {...register('address')}
                  />
                  {dirtyFields.address && errors.address?.message && (
                    <p className='text-xs text-rose-400'>{errors.address.message}</p>
                  )}
                </div>

                <div className='space-y-1'>
                  <label htmlFor='birthday' className='block text-sm font-medium mb-2 text-gray-300'>
                    Birthday
                  </label>
                  <div className='relative'>
                    <Controller
                      control={control}
                      name='birthday'
                      render={({ field }) => (
                        <DatePickerInput
                          id='birthday'
                          selected={parseDateOnly(field.value)}
                          onSelect={(d) => field.onChange(toDateOnlyString(d))}
                        />
                      )}
                    />
                  </div>
                  {dirtyFields.birthday && errors.birthday?.message && (
                    <p className='text-xs text-rose-400'>{errors.birthday.message}</p>
                  )}
                </div>
              </div>

              <Button
                type='submit'
                disabled={!hasChanges || isSaving}
                className='cursor-pointer w-full mt-6 text-white bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>

          {/* Right Column (1/3) - Account Info */}
          <div className='bg-neutral-800/50 rounded-lg h-fit border border-gray-800 p-6'>
            <h2 className='text-lg font-semibold mb-4 text-white'>Account Information</h2>
            <div className='space-y-3'>
              <div
                title='Buy MeAI Coins'
                onClick={() => navigate('/user/plans')}
                className='cursor-pointer p-3 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-md text-white text-sm font-medium flex items-center justify-between'
              >
                <span>MeAI Coins</span>
                <span>{profile.meAiCoin}</span>
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>Email</label>
                <div className='p-3 bg-neutral-800/50 rounded-md border border-gray-700 text-white text-sm flex items-center gap-2'>
                  <span className='truncate'>{profile.email}</span>
                  {profile.emailVerified && (
                    <span className='ml-auto inline-flex items-center text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded whitespace-nowrap font-medium'>
                      ✓ Verified
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>Username</label>
                <div className='p-3 bg-neutral-800/50 rounded-md border border-gray-700 text-white text-sm flex items-center gap-2'>
                  <span className='text-purple-500'>@</span>
                  <span className='truncate'>{profile.username}</span>
                </div>
              </div>
              <div className='pt-2 space-y-2'>
                <div className='flex justify-between items-center py-2 border-b border-gray-800'>
                  <span className='text-gray-400 text-xs'>Joined</span>
                  <span className='text-white text-xs font-medium'>
                    {profile.createdAt ? formatDateToLocaleString(profile.createdAt) : 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between items-center py-2 border-b border-gray-800'>
                  <span className='text-gray-400 text-xs'>Status</span>
                  <span className='text-green-400 text-xs font-medium'>Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
