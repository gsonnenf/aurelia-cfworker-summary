import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import aurelia from '@aurelia/vite-plugin';

export default defineConfig({
  server: {
    open: !process.env.CI,
    port: 9000,
  },
  // Vite 8 transforms with oxc, not esbuild; the `esbuild` key is deprecated
  // and silently ignored when both are present.
  oxc: {
    target: 'es2022'
  },
  plugins: [
    aurelia({
      useDev: true,
    }),
    nodePolyfills(),
  ],
   optimizeDeps: {  
    exclude: ['@aurelia/storybook', '@aurelia/runtime-html'] 
  }
});
