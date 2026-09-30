import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(__dirname, 'renderer'),
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: path.resolve(__dirname, 'main/index.ts'),
        onstart(args) {
          args.startup(['.', '--no-sandbox'], { cwd: __dirname })
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
            rollupOptions: {
              external: ['better-sqlite3'],
            },
          },
        },
      },
      preload: {
        input: path.resolve(__dirname, 'main/preload.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist-electron'),
          },
        },
      },
    }),
  ],
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer/src'),
      '@db': path.resolve(__dirname, 'db'),
      '@printing': path.resolve(__dirname, 'printing'),
    },
  },
})
