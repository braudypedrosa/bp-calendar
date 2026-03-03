import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/bp-calendar.js',
      name: 'BPCalendar',
      formats: ['iife'],
      fileName: () => 'bp-calendar.min.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Ensure the main CSS bundle is named bp-calendar.css
          if (assetInfo.name === 'style.css') {
            return 'bp-calendar.css';
          }
          return assetInfo.name ?? '[name][extname]';
        },
      },
    },
  },
});

