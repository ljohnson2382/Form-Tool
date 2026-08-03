import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: {
        'form-builder-kit': fileURLToPath(new URL('./src/index.js', import.meta.url)),
        'form-builder-kit-server': fileURLToPath(new URL('./src/server/index.js', import.meta.url)),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'form-builder-kit',
    },
    rollupOptions: {
      // The server entry is Node-only (Vercel serverless functions) and has
      // no business being bundled into the browser build, or vice versa —
      // both entries share this external list since Rollup doesn't scope it
      // per-entry, but React never appears in src/server/ and @vercel/blob
      // never appears in the browser entry, so this is inert either way.
      external: ['react', 'react-dom', 'react/jsx-runtime', '@vercel/blob'],
    },
  },
})
