import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0'
  },
  preview: {
    host: '0.0.0.0'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('pixi.js') || id.includes('@pixi')) return 'vendor-pixi';
          if (id.includes('firebase')) return 'vendor-firebase';
          if (id.includes('gsap') || id.includes('howler') || id.includes('spine')) return 'vendor-effects';
          return 'vendor-core';
        }
      }
    }
  }
});
