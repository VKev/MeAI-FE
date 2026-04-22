import { reactRouter } from '@react-router/dev/vite';
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
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths(), devtoolsJson()]
});
