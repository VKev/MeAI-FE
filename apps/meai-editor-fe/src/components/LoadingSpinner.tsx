import React from 'react';

const LoadingSpinner: React.FC<{ message: string }> = ({ message }) => (
  <div className='h-screen w-screen bg-background flex flex-col items-center justify-center'>
    <div className='w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3' />
    <p className='text-sm text-text-secondary'>{message}</p>
  </div>
);

export default React.memo(LoadingSpinner);
