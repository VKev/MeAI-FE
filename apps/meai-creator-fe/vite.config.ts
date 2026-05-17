import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import devtoolsJson from 'vite-plugin-devtools-json';
import type { RollupLog } from 'rollup';

function shouldSuppressBuildWarning(warning: RollupLog) {
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

export default defineConfig({
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
    port: 3000
  },
  server: {
    port: 3000,
    allowedHosts: ['hypnopompic-nonnegative-lissa.ngrok-free.dev', 'meaiplatform.io.vn', 'localhost']
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
});
