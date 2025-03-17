export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  testPathIgnorePatterns: ['/dist/'],
  moduleNameMapper: {
    '^@/(.*)\\.js$': '<rootDir>/src/$1.ts',
  },
  testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts'],
  globals: {
    __INTEGRATION__: true,
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/integration/setupTestDB.ts'],
};
