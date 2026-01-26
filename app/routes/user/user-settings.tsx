'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAuthMe, updateProfile } from '@/services/client/profile.client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Loader from '@/components/ui/loading';
import { formatDateToLocaleString } from '@/utils';
import { useNavigate } from 'react-router';

export default function UserSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    birthday: ''
  });
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch profile data
  const {
    data: profileResponse,
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: fetchAuthMe,
    select: (response) => response
  });

  const profile = profileResponse?.value;

  // Initialize form data when profile loads
  if (profile && formData.fullName === '') {
    setFormData({
      fullName: profile.fullName || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      birthday: profile.birthday ? new Date(profile.birthday).toISOString().split('T')[0] : ''
    });
  }

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateProfile>[0]) => updateProfile(data),
    onSuccess: (response) => {
      if (response.isSuccess && response.value) {
        // Update cache
        queryClient.setQueryData(['profile', 'me'], response);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    },
    onError: (error: any) => {
      console.error(error);
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      fullName: formData.fullName || null,
      phoneNumber: formData.phoneNumber || null,
      address: formData.address || null,
      birthday: formData.birthday ? new Date(formData.birthday).toISOString() : null
    });
  };

  const error = queryError || updateMutation.error;
  const isSaving = updateMutation.isPending;

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className='max-w-6xl mx-auto py-8 px-4'>
      <div className='mb-8'>
        <h1 className='text-white text-3xl font-bold mb-2'>Your Profile</h1>
        <p className='text-gray-400'>Manage your account information</p>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400'>
          {error instanceof Error
            ? error.message
            : typeof error === 'object' && error && 'message' in error
              ? (error as any).message
              : 'An error occurred'}
        </div>
      )}

      {success && (
        <div className='mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg text-green-400'>{success}</div>
      )}

      {profile && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Personal Information (2/3) */}
          <div className='lg:col-span-2 bg-[#0f1419] rounded-lg border border-gray-800 p-6'>
            <h2 className='text-xl font-semibold mb-6 text-white'>Personal Information</h2>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label htmlFor='fullName' className='block text-sm font-medium mb-2 text-gray-300'>
                    Full Name
                  </label>
                  <Input
                    id='fullName'
                    name='fullName'
                    type='text'
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder='Enter your full name'
                    className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                  />
                </div>

                <div>
                  <label htmlFor='phoneNumber' className='block text-sm font-medium mb-2 text-gray-300'>
                    Phone Number
                  </label>
                  <Input
                    id='phoneNumber'
                    name='phoneNumber'
                    type='tel'
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder='Enter your phone number'
                    className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                  />
                </div>
              </div>

              <div>
                <label htmlFor='address' className='block text-sm font-medium mb-2 text-gray-300'>
                  Address
                </label>
                <Input
                  id='address'
                  name='address'
                  type='text'
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder='Enter your address'
                  className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                />
              </div>

              <div>
                <label htmlFor='birthday' className='block text-sm font-medium mb-2 text-gray-300'>
                  Birthday
                </label>
                <Input
                  id='birthday'
                  name='birthday'
                  type='date'
                  value={formData.birthday}
                  onChange={handleInputChange}
                  className='text-white placeholder:text-white selection:bg-white/20 selection:text-white caret-white'
                />
              </div>

              <Button
                type='submit'
                disabled={isSaving}
                className='cursor-pointer w-full mt-6 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </div>

          {/* Right Column (1/3) - Account Info */}
          <div className='bg-[#0f1419] rounded-lg border border-gray-800 p-6'>
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
                <div className='p-3 bg-[#1a1f2e] rounded-md border border-gray-700 text-white text-sm flex items-center gap-2'>
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
                <div className='p-3 bg-[#1a1f2e] rounded-md border border-gray-700 text-white text-sm flex items-center gap-2'>
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
