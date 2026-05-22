const editorAssetPrefixes = new Map([
  ['/editor/assets/', '/assets/'],
  ['/editor/', '/']
]);

const editorRootAssets = new Map([
  ['/editor/sw.js', '/sw.js'],
  ['/editor/favicon.ico', '/favicon.ico'],
  ['/editor/black-logo.ico', '/black-logo.ico'],
  ['/editor/logo.png', '/logo.png'],
  ['/editor/logo-meai-2.png', '/logo-meai-2.png']
]);

function rewriteAssetRequest(request, pathname) {
  const targetUrl = new URL(request.url);
  targetUrl.pathname = pathname;
  return new Request(targetUrl, request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/editor' || url.pathname === '/editor/') {
      return env.ASSETS.fetch(rewriteAssetRequest(request, '/index.html'));
    }

    const rootAsset = editorRootAssets.get(url.pathname);
    if (rootAsset) {
      return env.ASSETS.fetch(rewriteAssetRequest(request, rootAsset));
    }

    for (const [prefix, replacement] of editorAssetPrefixes) {
      if (url.pathname.startsWith(prefix)) {
        const rewrittenPath = `${replacement}${url.pathname.slice(prefix.length)}`;
        return env.ASSETS.fetch(rewriteAssetRequest(request, rewrittenPath));
      }
    }

    return env.ASSETS.fetch(request);
  }
};
