export type EditablePostType = 'posts' | 'reels';

export function normalizePostType(value: string | null | undefined): EditablePostType {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'reel' || normalized === 'reels' || normalized === 'video' ? 'reels' : 'posts';
}

export function formatPostType(value: string | null | undefined): string {
  return normalizePostType(value) === 'reels' ? 'Reel' : 'Post';
}
