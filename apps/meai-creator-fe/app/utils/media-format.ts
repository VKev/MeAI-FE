type MediaFormatInput = {
  contentType?: string | null;
  url?: string | null;
  format?: string | null;
  mediaType?: string | null;
  fallback?: string | null;
};

const FORMAT_ALIASES: Record<string, string> = {
  jpeg: 'jpg',
  'svg+xml': 'svg',
  quicktime: 'mov',
  'x-matroska': 'mkv',
  'x-msvideo': 'avi'
};

function normalizeFormat(value: string | null | undefined) {
  const normalized = value?.trim().replace(/^\./, '').toLowerCase();
  if (!normalized) return null;
  return FORMAT_ALIASES[normalized] ?? normalized;
}

function getMediaCategory(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? '';
  if (normalized === 'image' || normalized.startsWith('image/')) return 'image';
  if (normalized === 'video' || normalized.startsWith('video/')) return 'video';
  return null;
}

function getFormatSubtype(value: string | null | undefined) {
  if (!value) return null;
  return normalizeFormat(value.split('/').at(-1));
}

function getUrlExtension(url: string | null | undefined) {
  if (!url) return null;

  const path = url.split(/[?#]/, 1)[0] ?? '';
  const fileName = path.split('/').at(-1) ?? '';
  const separatorIndex = fileName.lastIndexOf('.');
  if (separatorIndex < 0 || separatorIndex === fileName.length - 1) return null;

  return normalizeFormat(fileName.slice(separatorIndex + 1));
}

export function resolveMediaFormatLabel({ contentType, url, format, mediaType, fallback }: MediaFormatInput) {
  const category =
    getMediaCategory(contentType) ??
    getMediaCategory(format) ??
    getMediaCategory(mediaType) ??
    getMediaCategory(fallback) ??
    'file';
  const explicitFormat = getFormatSubtype(format);
  const extension = getUrlExtension(url);
  const mimeSubtype = getFormatSubtype(contentType?.split(';', 1)[0]);
  const normalizedMimeSubtype = mimeSubtype === 'octet-stream' ? null : mimeSubtype;
  const fallbackSubtype = getMediaCategory(fallback) ? null : getFormatSubtype(fallback);
  const subtype = explicitFormat ?? normalizedMimeSubtype ?? extension ?? fallbackSubtype ?? 'file';

  return `${category}/${subtype}`;
}
