module.exports = {
  displayName: 'database',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.type.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 95,
      lines: 90,
      statements: 90,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@aiofix/core$': '<rootDir>/src/index.ts',
    '^@aiofix/logging$': '<rootDir>/../logging/src/index.ts',
    '^@aiofix/config$': '<rootDir>/../config/src/index.ts',
    '^uuid$': '<rootDir>/src/__mocks__/uuid.js',
  },
  transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],
  testTimeout: 10000,
  verbose: true,
};
