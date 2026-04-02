import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

type VideoPreviewProps = {
  src: string;
  mediaLabel: string;
  defaultMuted?: boolean;
  children?: ReactNode;
};

function VideoPreview({ src, mediaLabel, defaultMuted = true, children }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(Boolean(src));
  const [isMuted, setIsMuted] = useState(defaultMuted);

  useEffect(() => {
    setIsPlaying(Boolean(src));
  }, [src]);

  useEffect(() => {
    setIsMuted(defaultMuted);
  }, [defaultMuted, src]);

  const handleVideoClick = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play();
      return;
    }

    video.pause();
  }, []);

  const handleToggleMute = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsMuted((prev) => !prev);
  }, []);

  const muteLabel = isMuted ? `Unmute ${mediaLabel}` : `Mute ${mediaLabel}`;
  const muteTitle = isMuted ? 'Unmute' : 'Mute';

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className='absolute inset-0 h-full w-full object-cover'
        autoPlay
        loop
        muted={isMuted}
        playsInline
      />

      <button
        type='button'
        onClick={handleToggleMute}
        className='absolute right-3 top-3 z-30 rounded-full border border-white/35 bg-black/55 p-2 text-white backdrop-blur transition hover:bg-black/70'
        aria-label={muteLabel}
        title={muteTitle}
      >
        {isMuted ? <VolumeX className='h-7 w-7' /> : <Volume2 className='h-7 w-7' />}
      </button>

      <div className='pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/30' />

      {!isPlaying && (
        <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center'>
          <div className='rounded-full bg-black/55 px-4 py-2 text-sm font-medium text-white'>Paused</div>
        </div>
      )}

      {children}
    </>
  );
}

export default VideoPreview;
