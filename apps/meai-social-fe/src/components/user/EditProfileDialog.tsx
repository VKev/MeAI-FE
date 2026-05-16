import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useForm, type FieldErrors, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UploadCloud } from 'lucide-react'
import { toast } from 'sonner'
import { normalizeText, getDateOnly } from '@/utils'
import {
  UpdateProfileFormSchema,
  type UpdateProfileData,
  type TProfile,
  type TUpdateProfilePayload
} from '@/models/profile.model'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const AVATAR_EXTENSIONS = new Set(['image/png', 'image/jpeg', 'image/jpg'])
const MAX_FILE_SIZE = 15 * 1024 * 1024
const PHONE_PREFIX = '+84'
const PHONE_PREFIX_DIGITS = '84'

const buildAvatarFallback = (username?: string | null) => (username ? username.slice(0, 2).toUpperCase() : 'ME')

function normalizePhoneDigits(value: string | null | undefined) {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  let next = digits

  if (next.startsWith(PHONE_PREFIX_DIGITS)) {
    const hasPrefix = value.trim().startsWith('+') || next.length > 9
    if (hasPrefix) {
      next = next.slice(PHONE_PREFIX_DIGITS.length)
    }
  }

  if (next.startsWith('0')) {
    next = next.slice(1)
  }

  return next.slice(0, 13)
}

function toPhonePayload(digits: string) {
  return digits ? `${PHONE_PREFIX}${digits}` : null
}

type NormalizedProfile = {
  fullName: string
  phoneDigits: string
  address: string
  birthday: string | null
}

const normalizeProfile = (profile: TProfile): NormalizedProfile => ({
  fullName: normalizeText(profile.fullName),
  phoneDigits: normalizePhoneDigits(profile.phoneNumber),
  address: normalizeText(profile.address),
  birthday: getDateOnly(profile.birthday) ?? null
})

const toFormValues = (normalized: NormalizedProfile): UpdateProfileData => ({
  fullName: normalized.fullName,
  phoneNumber: normalized.phoneDigits,
  address: normalized.address,
  birthday: normalized.birthday ?? ''
})

type EditProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: TProfile | null
  isProfileLoading?: boolean
  isProfileError?: boolean
  onRetry?: () => void
  onSubmit: (payload: TUpdateProfilePayload) => void
  onUploadAvatar: (file: File) => void
  isSaving?: boolean
  isUploading?: boolean
  profileUsername?: string
}

function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  isProfileLoading,
  isProfileError,
  onRetry,
  onSubmit,
  onUploadAvatar,
  isSaving,
  isUploading
}: EditProfileDialogProps) {
  const dirtyFieldsRef = useRef<Record<string, boolean | undefined>>({})
  const originalRef = useRef<NormalizedProfile | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const baseResolver = useMemo<Resolver<UpdateProfileData>>(() => zodResolver(UpdateProfileFormSchema), [])
  const resolver = useCallback<Resolver<UpdateProfileData>>(
    async (values, context, options) => {
      const result = await baseResolver(values, context, options)
      const dirtyFields = dirtyFieldsRef.current
      if (!dirtyFields) return result

      const filteredErrors = Object.fromEntries(
        Object.entries(result.errors).filter(([key]) => Boolean(dirtyFields[key]))
      ) as FieldErrors<UpdateProfileData>

      if (Object.keys(filteredErrors).length > 0) {
        return {
          values: {},
          errors: filteredErrors
        }
      }

      return {
        values,
        errors: {}
      }
    },
    [baseResolver]
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, dirtyFields }
  } = useForm<UpdateProfileData>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver,
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      address: '',
      birthday: ''
    }
  })

  const avatarUrl = profile?.avatarPresignedUrl ?? null
  const avatarFallback = buildAvatarFallback(profile?.username)

  useEffect(() => {
    dirtyFieldsRef.current = dirtyFields
  }, [dirtyFields])

  useEffect(() => {
    if (!open || !profile) return
    const normalized = normalizeProfile(profile)
    originalRef.current = normalized
    reset(toFormValues(normalized))
    dirtyFieldsRef.current = {}
  }, [open, profile, reset])

  const isBusy = Boolean(isSaving || isUploading)

  const phoneValue = watch('phoneNumber') ?? ''
  const formValues = watch()
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const hasChanges = useMemo(() => {
    const original = originalRef.current
    if (!original) return false
    const normalized: NormalizedProfile = {
      fullName: normalizeText(formValues.fullName ?? ''),
      phoneDigits: normalizePhoneDigits(formValues.phoneNumber ?? ''),
      address: normalizeText(formValues.address ?? ''),
      birthday: getDateOnly(formValues.birthday) ?? null
    }

    return (
      normalized.fullName !== original.fullName ||
      normalized.phoneDigits !== original.phoneDigits ||
      normalized.address !== original.address ||
      normalized.birthday !== original.birthday
    )
  }, [formValues.address, formValues.birthday, formValues.fullName, formValues.phoneNumber])

  const phoneRegister = register('phoneNumber', {
    onChange: (event) => {
      const next = normalizePhoneDigits(event.target.value as string)
      setValue('phoneNumber', next, { shouldDirty: true, shouldValidate: true })
    }
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBusy) return
    onOpenChange(nextOpen)
  }

  const handlePickAvatar = () => {
    if (isBusy) return
    fileInputRef.current?.click()
  }

  const handleSelectAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isBusy) return
    const file = event.target.files?.[0]
    if (!file) return

    if (!AVATAR_EXTENSIONS.has(file.type)) {
      toast.error('Only PNG or JPEG files are allowed')
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be 15MB or less')
      event.target.value = ''
      return
    }

    onUploadAvatar(file)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFormSubmit = (values: UpdateProfileData) => {
    const original = originalRef.current
    if (!original) return

    const normalized: NormalizedProfile = {
      fullName: normalizeText(values.fullName),
      phoneDigits: normalizePhoneDigits(values.phoneNumber),
      address: normalizeText(values.address),
      birthday: getDateOnly(values.birthday) ?? null
    }

    const payload: TUpdateProfilePayload = {}

    if (normalized.fullName !== original.fullName) {
      payload.fullName = normalized.fullName
    }

    if (normalized.phoneDigits !== original.phoneDigits) {
      payload.phoneNumber = toPhonePayload(normalized.phoneDigits)
    }

    if (normalized.address !== original.address) {
      payload.address = normalized.address || null
    }

    if (normalized.birthday !== original.birthday) {
      payload.birthday = normalized.birthday
    }

    if (!Object.keys(payload).length) {
      toast.info('No changes to save')
      return
    }

    onSubmit(payload)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className='w-[96vw] sm:max-w-2xl'
        showCloseButton={!isBusy}
        onInteractOutside={(event) => {
          if (isBusy) event.preventDefault()
        }}
        onEscapeKeyDown={(event) => {
          if (isBusy) event.preventDefault()
        }}
      >
        <DialogHeader className='items-center'>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        {isProfileLoading ? (
          <div className='space-y-4'>
            <div className='flex flex-col items-center gap-3'>
              <Skeleton className='h-20 w-20 rounded-full' />
              <Skeleton className='h-8 w-28' />
            </div>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <Skeleton className='h-11 w-full' />
              <Skeleton className='h-11 w-full' />
              <Skeleton className='h-11 w-full md:col-span-2' />
              <Skeleton className='h-11 w-full' />
            </div>
          </div>
        ) : isProfileError || !profile ? (
          <div className='space-y-4 text-sm text-muted-foreground'>
            <div>Unable to load profile details.</div>
            {onRetry ? (
              <Button variant='outline' size='sm' onClick={onRetry}>
                Try again
              </Button>
            ) : null}
          </div>
        ) : (
          <form className='space-y-4' onSubmit={handleSubmit(handleFormSubmit)}>
            <div className='flex flex-col items-center gap-3 text-center'>
              <Avatar className='h-20 w-20'>
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={profile?.username ?? 'avatar'} /> : null}
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
              <div>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/png,image/jpeg'
                  className='hidden'
                  onChange={handleSelectAvatar}
                />
                <Button type='button' variant='outline' size='sm' onClick={handlePickAvatar} disabled={isBusy}>
                  {isUploading ? <Loader2 className='h-4 w-4 animate-spin' /> : <UploadCloud className='h-4 w-4' />}
                  Change avatar
                </Button>
              </div>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-foreground' htmlFor='fullName'>
                  Full name
                </label>
                <Input
                  id='fullName'
                  type='text'
                  className='h-11'
                  aria-invalid={Boolean(errors.fullName)}
                  disabled={isBusy}
                  {...register('fullName')}
                />
                {errors.fullName?.message ? <p className='text-xs text-red-600'>{errors.fullName.message}</p> : null}
              </div>

              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-foreground' htmlFor='phoneNumber'>
                  Phone number
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>
                    {PHONE_PREFIX}
                  </span>
                  <Input
                    id='phoneNumber'
                    type='tel'
                    placeholder='9xx xxx xxxx'
                    className='h-11 pl-12'
                    aria-invalid={Boolean(errors.phoneNumber)}
                    disabled={isBusy}
                    value={phoneValue}
                    {...phoneRegister}
                  />
                </div>
                {errors.phoneNumber?.message ? (
                  <p className='text-xs text-red-600'>{errors.phoneNumber.message}</p>
                ) : null}
              </div>

              <div className='flex flex-col gap-2 md:col-span-2'>
                <label className='text-sm font-medium text-foreground' htmlFor='address'>
                  Address
                </label>
                <Input
                  id='address'
                  type='text'
                  placeholder='Enter your address'
                  className='h-11'
                  aria-invalid={Boolean(errors.address)}
                  disabled={isBusy}
                  {...register('address')}
                />
                {errors.address?.message ? <p className='text-xs text-red-600'>{errors.address.message}</p> : null}
              </div>

              <div className='flex flex-col gap-2'>
                <label className='text-sm font-medium text-foreground' htmlFor='birthday'>
                  Birthday
                </label>
                <Input
                  id='birthday'
                  type='date'
                  className='h-11'
                  max={today}
                  aria-invalid={Boolean(errors.birthday)}
                  disabled={isBusy}
                  {...register('birthday')}
                />
                {errors.birthday?.message ? <p className='text-xs text-red-600'>{errors.birthday.message}</p> : null}
              </div>
            </div>

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isBusy}>
                Cancel
              </Button>
              <Button type='submit' disabled={isBusy || !hasChanges}>
                {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
                Save changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default EditProfileDialog
