import type { Config } from '@react-router/dev/config';

export default {
  // Server-side render by default, to enable SPA mode set this to `false`.
  ssr: true,
  future: {
    // Required for React Router + @cloudflare/vite-plugin so the client and
    // Workers SSR builds share Vite's environment-aware output layout.
    v8_viteEnvironmentApi: true
  }
} satisfies Config;
