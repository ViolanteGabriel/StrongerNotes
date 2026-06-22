import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    maxWorkers: 1,
    setupFiles: ['./src/__tests__/setup.ts', './src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/**', 'src/middleware/**'],
      exclude: ['src/__tests__/**'],
    },
  },
});
