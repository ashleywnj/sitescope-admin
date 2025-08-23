import '@testing-library/jest-dom';
import 'jest-environment-jsdom';

// Mock Firebase to prevent actual network calls during testing
jest.mock('./src/app/firebase', () => ({
  db: jest.fn(),
  auth: {
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
    },
  },
}));

// Suppress specific warnings or errors during testing
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