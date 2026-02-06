'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAuthMe, updateProfile, uploadAvatar } from '@/services/client/profile.client';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/loading';
import { formatDateToLocaleString } from '@/utils';
import { useNavigate } from 'react-router';
import { Trash2Icon, User2Icon } from 'lucide-react';
import { toast } from 'react-toastify';

import { UpdateProfileRequestSchema } from '@/models/profile.model';

const UpdateProfileFormSchema = UpdateProfileRequestSchema.extend({
  fullName: z.string().min(1).max(100)
});

type FormValues = z.infer<typeof UpdateProfileFormSchema>;

export default function UserSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const originalRef = useRef<{
    fullName: string;
    phoneNumber: string;
    address: string;
    birthday: string | null;
  } | null>(null);

  const { register, handleSubmit, control, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(UpdateProfileFormSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      address: '',
      birthday: undefined
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  // const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch profile data
  const {
    data: profile,
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ['auth-me'],
    queryFn: fetchAuthMe,
    select: (data) => data.value
  });

  // Reset form when profile loads and store original values for comparison
  useEffect(() => {
    if (profile) {
      const vals = {
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        birthday: profile.birthday || undefined
      } as FormValues;
      reset(vals);
      originalRef.current = {
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        birthday: profile.birthday ? profile.birthday.split('T')[0] : null
      };
    }
  }, [profile, reset]);

  // Update profile mutation
  const { isPending: isSaving, mutate: updateMutation } = useMutation({
    mutationFn: (data: Parameters<typeof updateProfile>[0]) => updateProfile(data),
    onSuccess: (response) => {
      if (response.isSuccess) {
        // Update cache
        queryClient.refetchQueries({ queryKey: ['auth-me'] });
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile');
      }
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error?.message || 'Failed to update profile');
    }
  });

  // Upload avatar mutation
  const { mutate: uploadAvatarMutation } = useMutation({
    mutationFn: (file: File) => {
      return uploadAvatar(file);
    },
    onSuccess: (response) => {
      if (response.isSuccess) {
        // const resourceId = response.value.id;
        // // Now update profile with new avatarResourceId
        // updateMutation({ avatarResourceId: resourceId });
        toast.success('Avatar uploaded successfully!');
        // Refetch profile to get updated avatar
        queryClient.refetchQueries({ queryKey: ['auth-me'] });
      } else {
        toast.error('Failed to upload avatar');
      }
    },
    onError: (error: any) => {
      console.error(error);
      // setAvatarFile(null);
      toast.error(error?.message || 'Failed to upload avatar');
    }
  });

  // Form submission
  const onSubmit = (values: FormValues) => {
    const changed: Record<string, any> = {};
    const orig = originalRef.current;
    if (!orig) return;

    const norm = (s: string | undefined | null) => (s === undefined || s === null ? '' : s);

    if (norm(values.fullName) !== norm(orig.fullName)) changed.fullName = values.fullName || null;
    if (norm(values.phoneNumber) !== norm(orig.phoneNumber)) changed.phoneNumber = values.phoneNumber || null;
    if (norm(values.address) !== norm(orig.address)) changed.address = values.address || null;

    const formBirthdayOnly = values.birthday ? new Date(values.birthday).toISOString().split('T')[0] : null;
    const origBirthday = orig.birthday;
    if (formBirthdayOnly !== origBirthday) {
      // send full ISO string or null
      changed.birthday = values.birthday ? new Date(values.birthday).toISOString() : null;
    }

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
    const allowed = ['image/png', 'image/jpeg'];
    const maxBytes = 15 * 1024 * 1024; // 15 MB
    if (!allowed.includes(f.type)) {
      toast.error('Invalid file type. Only PNG and JPEG allowed');
      e.currentTarget.value = '';
      return;
    }
    if (f.size > maxBytes) {
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

      const norm = (s: string | undefined | null) => (s === undefined || s === null ? '' : s);

      const fullNameChanged = norm(values.fullName) !== norm(orig.fullName);
      const phoneChanged = norm(values.phoneNumber) !== norm(orig.phoneNumber);
      const addressChanged = norm(values.address) !== norm(orig.address);

      const formBirthdayOnly = values.birthday ? new Date(values.birthday).toISOString().split('T')[0] : null;
      const origBirthday = orig.birthday;
      const birthdayChanged = formBirthdayOnly !== origBirthday;

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
                  <Avatar key={profile?.avatarResourceId ?? 'fallback'} className='h-20 w-20'>
                    {profile?.avatarResourceId ? (
                      <AvatarImage
                        src={profile.avatarResourceId}
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
                <div>
                  <label htmlFor='fullName' className='block text-sm font-medium mb-2 text-gray-300'>
                    Full Name
                  </label>
                  <Input
                    id='fullName'
                    type='text'
                    placeholder='Enter your full name'
                    className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                    {...register('fullName')}
                  />
                </div>

                <div>
                  <label htmlFor='phoneNumber' className='block text-sm font-medium mb-2 text-gray-300'>
                    Phone Number
                  </label>
                  <Input
                    id='phoneNumber'
                    type='tel'
                    placeholder='Enter your phone number'
                    className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                    {...register('phoneNumber')}
                  />
                </div>

                <div>
                  <label htmlFor='address' className='block text-sm font-medium mb-2 text-gray-300'>
                    Address
                  </label>
                  <Input
                    id='address'
                    type='text'
                    placeholder='Enter your address'
                    className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                    {...register('address')}
                  />
                </div>

                <div>
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
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(d) => field.onChange(d ? new Date(d).toISOString() : undefined)}
                        />
                      )}
                    />
                  </div>
                </div>
              </div>

              <Button
                type='submit'
                disabled={!hasChanges || isSaving}
                className='cursor-pointer w-full mt-6 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
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
