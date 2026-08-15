import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
