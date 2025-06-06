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
      '!**/*.interface.ts',
      '!**/*.dto.ts',
      '!**/*.entity.ts',
      '!main.ts',
    ],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
      '^src/(.*)$': '<rootDir>/$1',
    },
    preset: 'ts-jest',
    testTimeout: 30000,
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    
    // ================================
    // COVERAGE THRESHOLDS
    // ================================
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
      // Module-specific thresholds
      './src/auth/**/*.ts': {
        branches: 85,
        functions: 85,
        lines: 85,
        statements: 85,
      },
      './src/users/**/*.ts': {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
      // Gradually increase as you add modules
      './src/organizations/**/*.ts': {
        branches: 75,
        functions: 75,
        lines: 75,
        statements: 75,
      },
    },
    
    // Coverage reporters
    coverageReporters: [
      'text',
      'text-summary',
      'html',
      'lcov',
      'clover'
    ],
    
    verbose: true,
  };
  
  // ================================
  // .eslintrc.js - Quality rules
  // ================================
  module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: 'tsconfig.json',
      tsconfigRootDir: __dirname,
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint/eslint-plugin'],
    extends: [
      '@nestjs',
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
    ],
    root: true,
    env: {
      node: true,
      jest: true,
    },
    ignorePatterns: ['.eslintrc.js'],
    rules: {
      // Code Quality Rules
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/prefer-const': 'error',
      
      // Security Rules
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      
      // Performance Rules
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-includes': 'warn',
      
      // Consistency Rules
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
      ],
    },
  };
  
  // ================================
  // .prettierrc - Code formatting
  // ================================
  const prettierConfig = {
    semi: true,
    trailingComma: 'all',
    singleQuote: true,
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
  };
  
  // ================================
  // HUSKY PRE-COMMIT HOOKS
  // ================================
  // package.json additions:
  const huskyConfig = {
    "husky": {
      "hooks": {
        "pre-commit": "lint-staged",
        "pre-push": "npm run test:unit",
        "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
      }
    },
    "lint-staged": {
      "*.{ts,js}": [
        "eslint --fix",
        "prettier --write",
        "git add"
      ],
      "*.{ts,spec.ts}": [
        "jest --findRelatedTests --passWithNoTests"
      ]
    }
  };
  
  export { prettierConfig, huskyConfig };