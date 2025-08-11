module.exports = {
  // Use projects for running tests in both frontend and backend
  projects: [
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/frontend/src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
      transform: {
        '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/frontend/node_modules/react-scripts/config/jest/babelTransform.js',
        '^.+\\.css$': '<rootDir>/frontend/node_modules/react-scripts/config/jest/cssTransform.js',
        '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '<rootDir>/frontend/node_modules/react-scripts/config/jest/fileTransform.js',
      },
      transformIgnorePatterns: [
        '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|mjs|cjs|ts|tsx)$',
        '^.+\\.module\\.(css|sass|scss)$',
      ],
      moduleNameMapper: {
        '^react-native$': 'react-native-web',
        '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
        '^@/(.*)$': '<rootDir>/frontend/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/frontend/src/setupTests.ts'],
      coverageDirectory: '<rootDir>/frontend/coverage',
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '/build/',
        '/dist/',
        '.d.ts$',
        '/tests/',
        'setupTests.ts',
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      collectCoverageFrom: [
        'frontend/src/**/*.{js,jsx,ts,tsx}',
        '!frontend/src/**/*.d.ts',
        '!frontend/src/index.tsx',
        '!frontend/src/reportWebVitals.ts',
        '!frontend/src/setupTests.ts',
        '!frontend/src/**/*.stories.{js,jsx,ts,tsx}',
      ],
    },
    {
      displayName: 'backend',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/**/*.{test,spec}.{js,ts}'],
      transform: {
        '^.+\\.js$': 'babel-jest',
      },
      setupFilesAfterEnv: ['<rootDir>/backend/tests/setup.js'],
      coverageDirectory: '<rootDir>/backend/coverage',
      coveragePathIgnorePatterns: [
        '/node_modules/',
        '/build/',
        '/dist/',
        '/tests/',
        '/migrations/',
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      collectCoverageFrom: [
        'backend/**/*.js',
        '!backend/node_modules/**',
        '!backend/coverage/**',
        '!backend/tests/**',
        '!backend/database/migrations/**',
        '!backend/**/*.test.js',
        '!backend/**/*.spec.js',
      ],
      testTimeout: 10000,
    },
  ],
  
  // Common settings
  maxWorkers: '50%',
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  
  // Global setup
  globalSetup: '<rootDir>/scripts/jest-global-setup.js',
  globalTeardown: '<rootDir>/scripts/jest-global-teardown.js',
  
  // Performance
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Error handling
  errorOnDeprecated: true,
  
  // Notifications
  notify: true,
  notifyMode: 'failure-change',
};