import { defineConfig } from '@playwright/experimental-ct-react';
import path from 'path';

export default defineConfig({
  testDir: './src',
  testMatch: '**/*.spec.tsx',
  use: {
    viewport: { width: 1280, height: 720 },
    ctViteConfig: {
      resolve: {
        alias: {
          '~': path.resolve(__dirname, './src'),
        },
      },
    },
  },
});
