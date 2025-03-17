export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  testPathIgnorePatterns: ['/dist/'],
  moduleNameMapper: {
    '^@/(.*)\\.js$': '<rootDir>/src/$1.ts',
  },
  testMatch: ['<rootDir>/src/tests/unit/**/*.test.ts'],
  globals: {
    __INTEGRATION__: false,
  },
};
