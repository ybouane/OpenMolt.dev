import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  resolve: {
    // Alias react-router-dom (v5 from parent Docusaurus node_modules) → react-router v7
    alias: {
      'react-router-dom': 'react-router',
    },
    // Ensure only one copy of these packages is ever resolved
    dedupe: ['react', 'react-dom', 'react-router'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router'],
  },
  server: {
    port: 62053,
    host: 'localhost',
    allowedHosts: ['openmolt.dev', 'localhost'],
  },
});
