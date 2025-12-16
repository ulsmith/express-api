// Jest global teardown file to ensure all resources are cleaned up
// This runs once after all test suites complete

export default async function globalTeardown() {
	// Clean up any global mocks
	// Note: If there are still open handles, they should be identified and fixed
	// rather than using forceExit
}
