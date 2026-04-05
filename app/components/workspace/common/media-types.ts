export type MediaSource = 'upload' | 'generation';

export type MediaItem = {
  id: string;
  url: string;
  source: MediaSource;
  isObjectUrl?: boolean;
};

export type MediaTab = 'uploads' | 'generations';
