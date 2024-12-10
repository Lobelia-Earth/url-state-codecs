import { defineConfig, configDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    root: './src',
    coverage: {
      reportsDirectory: '../coverage',
      exclude: [...(configDefaults.coverage.exclude ?? []), './**/types.ts'],
    },
  },
});
