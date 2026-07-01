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
          if (id.includes('@esotericsoftware') || id.includes('spine')) return 'vendor-spine-v1079';
          if (id.includes('howler')) return 'vendor-audio-v1079';
          if (id.includes('gsap')) return 'vendor-motion-v1079';
          return 'vendor-core';
        }
      }
    }
  }
});
