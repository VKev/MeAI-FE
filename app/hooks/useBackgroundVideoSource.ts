import { useEffect, useState } from 'react';

const BACKGROUND_VIDEO_PATH = '/background.webm';
const CACHE_NAME = 'meai-assets-v1';
const CACHE_KEY = '/background.webm';
const LS_KEY = 'meai.background.webm.cached.v1';
const CACHE_VERSION = 1;

type CacheMeta = {
  cached: boolean;
  size: number;
  cachedAt: string;
  version: number;
};

export type UseBackgroundVideoSourceResult = {
  src: string;
  isReady: boolean;
};

function readCacheFlag(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as Partial<CacheMeta>;
    return parsed.cached === true && parsed.version === CACHE_VERSION;
  } catch {
    return false;
  }
}

function clearCacheFlag(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(LS_KEY);
  } catch {
    // Best-effort cleanup only.
  }
}

function writeCacheFlag(size: number): void {
  if (typeof window === 'undefined') return;

  try {
    const payload: CacheMeta = {
      cached: true,
      size,
      cachedAt: new Date().toISOString(),
      version: CACHE_VERSION
    };
    window.localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {
    // Best-effort persistence only.
  }
}

export function useBackgroundVideoSource(): UseBackgroundVideoSourceResult {
  const [src, setSrc] = useState<string>(BACKGROUND_VIDEO_PATH);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isCancelled = false;
    let activeObjectUrl: string | null = null;
    const fetchController = new AbortController();

    const setObjectUrlSource = async (response: Response) => {
      const blob = await response.blob();
      if (isCancelled) return;

      const objectUrl = URL.createObjectURL(blob);
      activeObjectUrl = objectUrl;
      setSrc(objectUrl);
    };

    const hydrateSourceFromCache = async () => {
      if (!('caches' in window)) return;
      if (!readCacheFlag()) return;

      try {
        const cache = await window.caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(CACHE_KEY);

        if (!cachedResponse) {
          clearCacheFlag();
          return;
        }

        await setObjectUrlSource(cachedResponse);
      } catch {
        clearCacheFlag();
      }
    };

    const streamAndPersistVideo = async () => {
      if (!('caches' in window)) return;

      try {
        const response = await fetch(BACKGROUND_VIDEO_PATH, {
          cache: 'no-store',
          signal: fetchController.signal
        });

        if (!response.ok) return;

        const contentType = response.headers.get('Content-Type') ?? 'video/webm';
        const cache = await window.caches.open(CACHE_NAME);

        if (!response.body) {
          const clone = response.clone();
          await cache.put(CACHE_KEY, clone);

          let size = 0;
          try {
            size = (await response.blob()).size;
          } catch {
            // Ignore size resolution errors.
          }

          writeCacheFlag(size);
          return;
        }

        const reader = response.body.getReader();
        const chunks: BlobPart[] = [];
        let totalSize = 0;

        while (!isCancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          const normalizedChunk = new Uint8Array(value.byteLength);
          normalizedChunk.set(value);

          chunks.push(normalizedChunk);
          totalSize += value.byteLength;
        }

        if (isCancelled) return;

        const fullBlob = new Blob(chunks, { type: contentType });
        const cacheResponse = new Response(fullBlob, {
          headers: { 'Content-Type': contentType }
        });

        await cache.put(CACHE_KEY, cacheResponse);
        writeCacheFlag(totalSize);
      } catch {
        if (fetchController.signal.aborted) return;
        // Best-effort caching. Playback continues from the static file URL.
      }
    };

    const init = async () => {
      await hydrateSourceFromCache();
      if (!isCancelled) {
        setIsReady(true);
      }

      await streamAndPersistVideo();
    };

    init();

    return () => {
      isCancelled = true;
      fetchController.abort();

      if (activeObjectUrl) {
        URL.revokeObjectURL(activeObjectUrl);
      }
    };
  }, []);

  return {
    src,
    isReady
  };
}
