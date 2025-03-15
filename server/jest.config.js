export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  testPathIgnorePatterns: ['/dist/'],
  moduleNameMapper: {
    '^@/(.*)\\.js$': '<rootDir>/src/$1.ts',
  },
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',
    '<rootDir>/tests/integration/**/*.test.ts',
  ],
  globals: {
    __INTEGRATION__: process.env.TEST_TYPE === 'integration',
  },
};
