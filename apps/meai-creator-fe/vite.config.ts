import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import devtoolsJson from 'vite-plugin-devtools-json';

type BuildWarning = {
  code?: string;
  id?: string;
  names?: string[];
};

function shouldSuppressBuildWarning(warning: BuildWarning) {
  if (warning.code === 'INVALID_ANNOTATION' && warning.id?.includes('@microsoft/signalr')) {
    return true;
  }

  if (warning.code === 'SOURCEMAP_ERROR' && warning.id?.endsWith('app/components/ui/calendar.tsx')) {
    return true;
  }

  if (
    warning.code === 'EMPTY_BUNDLE' &&
    warning.names?.every((name) =>
      ['refresh', 'session-check', 'notification-token', 'logout', 'proxy'].includes(String(name))
    )
  ) {
    return true;
  }

  return false;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_URL || 'http://localhost:2406';
  const editorTarget = env.VITE_EDITOR_URL || 'http://localhost:5173';

  return {
    build: {
      rollupOptions: {
        onwarn(warning, defaultHandler) {
          if (shouldSuppressBuildWarning(warning)) {
            return;
          }

          defaultHandler(warning);
        }
      }
    },
    css: {
      devSourcemap: true
    },
    preview: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true
    },
    server: {
      host: "0.0.0.0",
      strictPort: true,
      port: 3000,
      allowedHosts: [
        'meai-fe',
        'meai-fe.vkev.me',
        'meaiplatform.io.vn',
        'social.meaiplatform.io.vn',
        'hypnopompic-nonnegative-lissa.ngrok-free.dev',
        'localhost',
        '127.0.0.1'
      ],
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: apiTarget.startsWith('https://')
        },
        '/editor': {
          target: editorTarget,
          changeOrigin: true,
          ws: true,
          cookieDomainRewrite: '',
          cookiePathRewrite: '/editor'
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './app')
      }
    },
    // Plugin order matters: `cloudflare()` must come BEFORE `reactRouter()` so
    // the React Router dev plugin picks up the Workers-shaped `ssr` environment
    // (workerd runtime) rather than the default Node SSR environment.
    plugins: [
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tailwindcss(),
      reactRouter(),
      tsconfigPaths(),
      devtoolsJson()
    ]
  };
});
