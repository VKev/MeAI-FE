type MediaFormatInput = {
  contentType?: string | null;
  url?: string | null;
  format?: string | null;
  fallback?: string | null;
};

const FORMAT_ALIASES: Record<string, string> = {
  jpeg: 'JPG',
  'svg+xml': 'SVG',
  quicktime: 'MOV',
  'x-matroska': 'MKV',
  'x-msvideo': 'AVI'
};

function normalizeFormat(value: string | null | undefined) {
  const normalized = value?.trim().replace(/^\./, '').toLowerCase();
  if (!normalized) return null;
  return FORMAT_ALIASES[normalized] ?? normalized.toUpperCase();
}

function getUrlExtension(url: string | null | undefined) {
  if (!url) return null;

  const path = url.split(/[?#]/, 1)[0] ?? '';
  const fileName = path.split('/').at(-1) ?? '';
  const separatorIndex = fileName.lastIndexOf('.');
  if (separatorIndex < 0 || separatorIndex === fileName.length - 1) return null;

  return normalizeFormat(fileName.slice(separatorIndex + 1));
}

export function resolveMediaFormatLabel({ contentType, url, format, fallback }: MediaFormatInput) {
  const explicitFormat = normalizeFormat(format);
  if (explicitFormat) return explicitFormat;

  const extension = getUrlExtension(url);
  const mimeSubtype = contentType?.split(';', 1)[0]?.split('/').at(-1);
  const normalizedMimeSubtype = normalizeFormat(mimeSubtype);

  if (normalizedMimeSubtype && normalizedMimeSubtype !== 'OCTET-STREAM') {
    return normalizedMimeSubtype;
  }

  return extension ?? normalizeFormat(fallback) ?? 'FILE';
}
