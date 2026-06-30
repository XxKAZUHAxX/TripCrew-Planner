import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Smoke suites are migrated to Vitest in M1; until then they self-execute.
    include: ['**/*.{test,spec}.{js,ts}'],
    passWithNoTests: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
