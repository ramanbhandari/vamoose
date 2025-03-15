import baseConfig from './jest.config.js';

export default {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
};