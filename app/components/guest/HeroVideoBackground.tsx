import { useState } from 'react';
import { useBackgroundVideoSource } from '@/hooks/useBackgroundVideoSource';

export function HeroVideoBackground() {
  const { src, isReady } = useBackgroundVideoSource();
  const [canPlay, setCanPlay] = useState(false);

  return (
    <div className='absolute inset-0 overflow-hidden bg-[#050507]'>
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload='auto'
        onCanPlay={() => setCanPlay(true)}
        className='h-full w-full object-cover object-center opacity-100 [filter:contrast(1.06)_saturate(1.08)]'
      />

      <div className='absolute inset-0 bg-black/42' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,rgba(181,96,255,0.14),rgba(181,96,255,0)_72%)]' />
      <div className='absolute inset-0 bg-gradient-to-b from-[#050507]/78 via-[#050507]/16 to-[#050507]/94' />
      <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_32%,rgba(0,0,0,0.64)_100%)]' />
      <div className='absolute inset-x-0 bottom-[20vh] h-[24vh] bg-gradient-to-b from-transparent via-[#050507]/72 to-[#050507]/98' />
      <div className='absolute inset-x-0 bottom-0 h-[42vh] bg-gradient-to-t from-[#050507] via-[#050507]/92 to-transparent' />
      <div className='absolute inset-x-0 bottom-[-16vh] h-[44vh] bg-[radial-gradient(ellipse_at_center,rgba(5,5,7,0.96)_0%,rgba(5,5,7,1)_72%)]' />
      {(!isReady || !canPlay) && (
        <div className='absolute inset-0 bg-[linear-gradient(120deg,rgba(88,56,170,0.18),rgba(18,18,26,0.1),rgba(204,116,255,0.16))]' />
      )}
    </div>
  );
}
