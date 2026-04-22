import { reactRouter } from '@react-router/dev/vite';
import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import devtoolsJson from 'vite-plugin-devtools-json';

export default defineConfig({
  css: {
    devSourcemap: true
  },
  preview: {
    port: 3000
  },
  server: {
    port: 3000,
    allowedHosts: ['hypnopompic-nonnegative-lissa.ngrok-free.dev', 'meai-fe.vkev.me']
  },
  // Plugin order matters: `cloudflare()` must come BEFORE `reactRouter()` so
  // the React Router dev plugin picks up the Workers-shaped `ssr` environment
  // (workerd runtime) rather than the default Node SSR environment.
  plugins: [cloudflare({ viteEnvironment: { name: 'ssr' } }), tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()]
});
