 I see the issue! The deployment error shows it's still trying to create an "export-marker.json" which means the
  CI/CD is still using static export mode, and Firebase is initializing during the build process without
  environment variables. Let me document the exact changes needed:

  Changes Needed to Standardize sitescope-admin with sitescope-web

  1. package.json - Update scripts and dependencies

  Current sitescope-admin:
  {
    "scripts": {
      "dev": "next dev --turbopack",
      "build": "next build --turbopack",
      "start": "next start",
      "lint": "eslint"
    },
    "dependencies": {
      "@emotion/react": "^11.14.0",
      "@emotion/styled": "^11.14.1",
      "@mui/icons-material": "^7.3.1",
      "@mui/material": "^7.3.1",
      "firebase": "^12.1.0",
      "next": "15.5.0",
      "react": "19.1.0",
      "react-dom": "19.1.0"
    },
    "devDependencies": {
      // existing devDeps...
    }
  }

  Change to match sitescope-web:
  {
    "scripts": {
      "dev": "next dev --turbopack",
      "build": "next build",
      "start": "next start",
      "lint": "next lint",
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage"
    },
    "dependencies": {
      "@dnd-kit/core": "^6.3.1",
      "@dnd-kit/sortable": "^10.0.0",
      "@dnd-kit/utilities": "^3.2.2",
      "@emotion/react": "^11.14.0",
      "@emotion/styled": "^11.14.1",
      "@mui/icons-material": "^7.2.0",
      "firebase": "^10.14.1",
      "firebase-admin": "^13.4.0",
      "jszip": "^3.10.1",
      "next": "15.4.1",
      "react": "19.1.0",
      "react-dom": "19.1.0"
    },
    "devDependencies": {
      "@eslint/eslintrc": "^3",
      "@tailwindcss/postcss": "^4",
      "@testing-library/jest-dom": "^6.6.4",
      "@testing-library/react": "^16.3.0",
      "@testing-library/user-event": "^14.6.1",
      "@types/jest": "^30.0.0",
      "@types/node": "^20",
      "@types/react": "^19",
      "@types/react-dom": "^19",
      "eslint": "^9",
      "eslint-config-next": "15.4.1",
      "firebase-mock": "^2.3.2",
      "jest": "^30.0.5",
      "jest-environment-jsdom": "^30.0.5",
      "tailwindcss": "^4",
      "ts-jest": "^29.4.0",
      "typescript": "^5"
    }
  }

  2. next.config.ts - Remove static export settings

  Current sitescope-admin:
  const nextConfig: NextConfig = {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
      // ... rest of config
    }
  }

  Change to match sitescope-web:
  const nextConfig: NextConfig = {
    /* config options here */
    images: {
      remotePatterns: [
        // ... same remote patterns (remove unoptimized: true)
      ],
    },
    // ... rest of webpack config stays the same
  }

  3. src/app/firebase.ts - Direct initialization

  Current sitescope-admin (with client-side checks):
  // Initialize Firebase only on client side and with valid config
  let app: any = null;
  let auth: any = null;
  let db: any = null;
  let storage: any = null;

  if (typeof window !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
    } catch (error) {
      console.warn('Firebase initialization failed:', error);
    }
  }

  Change to match sitescope-web:
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  4. tsconfig.json - Update include/exclude patterns

  Add to tsconfig.json:
  {
    "include": [
      "**/*.ts",
      "**/*.tsx",
      ".next/types/**/*.ts",
      "next-env.d.ts",
      "out/types/**/*.ts"
    ],
    "exclude": [
      "node_modules",
      "functions/**/*",
      "scripts/**/*"
    ]
  }

  5. eslint.config.mjs - Simplify to match sitescope-web

  Change from:
  const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
      ignores: [/* custom ignore patterns */]
    }
  ];

  To:
  const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
  ];

  6. Add Jest configuration files

  Create jest.config.js:
  const nextJest = require('next/jest')

  const createJestConfig = nextJest({
    dir: './',
  })

  const customJestConfig = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/.firebase/'],
    collectCoverageFrom: [
      'src/**/*.{js,jsx,ts,tsx}',
      '!src/**/*.d.ts',
      '!src/app/layout.tsx',
      '!src/app/page.tsx',
    ],
    coverageThreshold: {
      global: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    modulePathIgnorePatterns: ['<rootDir>/.firebase/'],
  }

  module.exports = createJestConfig(customJestConfig)

  Create jest.setup.js:
  import '@testing-library/jest-dom';
  import 'jest-environment-jsdom';

  jest.mock('./src/app/firebase', () => ({
    db: jest.fn(),
    auth: {
      currentUser: {
        uid: 'test-user-id',
        email: 'test@example.com',
      },
    },
  }));

  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update inside a test was not wrapped in act') ||
       args[0].includes('Warning: ReactDOM.render is no longer supported'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  7. Keep firebase.json as-is

  The firebase.json should remain unchanged with "site": "sitescope-admin" to preserve the hosting difference.

  Summary of Changes:

  1. Remove static export (output: 'export', trailingSlash: true, images.unoptimized)
  2. Add missing dependencies (testing libs, @dnd-kit, firebase-admin, jszip)
  3. Update Firebase initialization to match sitescope-web exactly
  4. Add Jest configuration for testing
  5. Update build scripts and linting configuration

  This will make both projects use identical Next.js SSR deployment with Firebase hosting using frameworksBackend.