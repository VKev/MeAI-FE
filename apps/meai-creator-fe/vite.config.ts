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
      allowedHosts: ['meaiplatform.io.vn', 'localhost', '127.0.0.1', '.ngrok-free.dev'],
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: true,
        },
        '/editor': {
          target: env.VITE_EDITOR_URL,
          changeOrigin: true,
          ws: true,
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
    plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()]
  }
});
