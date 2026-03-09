import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,        // hides source code from DevTools
    minify: 'terser',        // stronger obfuscation
    terserOptions: {
      compress: {
        drop_console: true,  // removes console.logs in production
        drop_debugger: true,
      },
      mangle: {
        toplevel: true,      // aggressively renames variables/functions
      }
    },
    rollupOptions: {
      output: {
        // randomizes chunk filenames — harder to map to source
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]',
      }
    }
  }
})