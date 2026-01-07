/**
 * Jest test setup and global configuration
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console.log during tests unless explicitly needed
const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  if (process.env.VERBOSE_TESTS === 'true') {
    originalConsoleLog(...args);
  }
};

// Restore console.log after tests
afterAll(() => {
  console.log = originalConsoleLog;
});
