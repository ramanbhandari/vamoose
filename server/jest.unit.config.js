import baseConfig from './jest.config.js';

export default {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
};
