module.exports = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: [
      '**/*.(t|j)s',
      '!**/*.spec.ts',
      '!**/*.e2e-spec.ts',
      '!**/node_modules/**',
      '!**/dist/**',
    ],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
      '^src/(.*)$': '<rootDir>/$1',
    },
    preset: 'ts-jest',
    testTimeout: 30000,
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    verbose: true,
  };