import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    // Provide required Vite env variables for the test environment
    env: {
      VITE_API_ENDPOINT: 'http://localhost:3000',
      VITE_API_DELAY: '1',
      VITE_API_STORAGE_MODE: 'session',
      VITE_API_USER_EMAIL: 'user@nukeapp.com',
      VITE_API_USER_PASSWORD: '37fVgE',
      VITE_JWT_SECRET: 'cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2',
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      // Map SVG ?react imports to a simple mock component in tests
      {
        find: /^(.+)\.svg\?react$/,
        replacement: path.resolve(__dirname, 'src/test/svg-mock.ts'),
      },
    ],
  },
  css: {
    modules: {
      generateScopedName: '[name]__[local]__[hash:8]',
      localsConvention: null,
    },
  },
})
