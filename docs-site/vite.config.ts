import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/sdcorejs-ultis/',
  resolve: {
    alias: [
      { find: '@sdcorejs/utils/models',    replacement: resolve(__dirname, '../src/models/index.ts') },
      { find: '@sdcorejs/utils/constants', replacement: resolve(__dirname, '../src/constants/index.ts') },
      { find: '@sdcorejs/utils/fns',       replacement: resolve(__dirname, '../src/fns/index.ts') },
      { find: '@sdcorejs/utils',           replacement: resolve(__dirname, '../src/index.ts') },
    ],
  },
});
