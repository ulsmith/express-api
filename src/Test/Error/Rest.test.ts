import { jest } from '@jest/globals';
import RestError from '../../Error/Rest';

describe('RestError', () => {
	it('should create error with message and status code', () => {
		const error = new RestError('Not found', 404);
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(RestError);
		expect(error.message).toBe('Not found');
		expect(error.status).toBe(404);
		expect(error.name).toBe('RestError');
		expect(error.exception).toBe(true);
	});

	it('should handle different status codes', () => {
		expect(new RestError('Bad request', 400).status).toBe(400);
		expect(new RestError('Unauthorized', 401).status).toBe(401);
		expect(new RestError('Forbidden', 403).status).toBe(403);
		expect(new RestError('Not found', 404).status).toBe(404);
		expect(new RestError('Server error', 500).status).toBe(500);
	});

	it('should log error when logging is "all"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new RestError('Test error', 500, 'all');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should log error when logging is "error"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new RestError('Test error', 500, 'error');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log error when logging is "warning"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new RestError('Test error', 500, 'warning');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log error when logging is not provided', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new RestError('Test error', 500);
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should handle case-insensitive logging', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new RestError('Test error', 500, 'ERROR');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should maintain stack trace', () => {
		const error = new RestError('Test error', 500);
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain('RestError');
	});
});

