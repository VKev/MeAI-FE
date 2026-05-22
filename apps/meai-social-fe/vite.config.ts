import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  server: {
    host: '0.0.0.0',
    strictPort: true,
    port: 3030,
    allowedHosts: ['meai-fe', 'meai-fe.vkev.me', 'meaiplatform.io.vn', 'social.meaiplatform.io.vn', 'localhost', '127.0.0.1']
  },
  preview: {
    host: '0.0.0.0',
    strictPort: true,
    port: 3030
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
