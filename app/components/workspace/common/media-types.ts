export type MediaSource = 'upload' | 'generation' | 'resource';

export type MediaItem = {
  id: string;
  url: string;
  source: MediaSource;
  isObjectUrl?: boolean;
  isVideo?: boolean;
};
