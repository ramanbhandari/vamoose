export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  testPathIgnorePatterns: ['/dist/'],
  moduleNameMapper: {
    '^@/(.*)\\.js$': '<rootDir>/src/$1.ts',
  },
  globals: {
    __INTEGRATION__: process.env.TEST_TYPE === 'integration',
  },
};
