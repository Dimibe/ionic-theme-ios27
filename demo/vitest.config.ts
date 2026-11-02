import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Keep platform mocks isolated when CI runs multiple specs in one worker.
    isolate: true,
    setupFiles: ['src/test-setup.ts'],
    server: { deps: { inline: [/@ionic\/angular/, /@ionic\/core/, /ionicons/, /@rdlabo\/ionic-theme-/] } },
  },
});
