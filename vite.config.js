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
          if (id.includes('pixi.js') || id.includes('@pixi')) {
            if (id.includes('/assets/') || id.includes('/spritesheet/') || id.includes('/compressed-textures/')) return 'vendor-pixi-assets-v1081';
            if (id.includes('/graphics/') || id.includes('/scene/') || id.includes('/maths/')) return 'vendor-pixi-scene-v1081';
            if (id.includes('/rendering/') || id.includes('/app/')) return 'vendor-pixi-renderer-v1081';
            return 'vendor-pixi-core-v1081';
          }
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
