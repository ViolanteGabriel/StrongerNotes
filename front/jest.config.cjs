/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  // setupFiles runs before the test framework is installed — sets globals React needs
  setupFiles: ['<rootDir>/src/__tests__/setupGlobals.ts'],
  // setupFilesAfterEnv runs after — loads jest-dom matchers
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__tests__/styleMock.cjs',
    '\\.(svg|png|jpg|jpeg|gif|ico)$': '<rootDir>/src/__tests__/fileMock.cjs',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
};
