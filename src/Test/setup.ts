// Jest setup file to silence console warnings during tests
// This prevents expected validation warnings from cluttering test output

// Mock console.warn to suppress warnings during tests
// Using an empty function instead of jest.fn() to avoid ESM issues
console.warn = () => {};
