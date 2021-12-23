import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    outDir: './package/dist/',
    lib: {
      entry: 'src/lib/index.ts',
      name: 'Pagedown',
      fileName: (format) => `pagedown.${format}.js`
    },
    rollupOptions: {
      output: {
        assetFileNames: 'pagedown.[ext]'
      }
    }
  }
})
