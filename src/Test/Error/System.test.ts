import { jest } from '@jest/globals';
import SystemError from '../../Error/System';

describe('SystemError', () => {
	it('should create error with message', () => {
		const error = new SystemError('Test error message');
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(SystemError);
		expect(error.message).toBe('Test error message');
		expect(error.name).toBe('SystemError');
		expect(error.exception).toBe(true);
	});

	it('should create error with message and details', () => {
		const details = { code: 500, context: 'test' };
		const error = new SystemError('Test error', details);
		expect(error.message).toBe('Test error');
		expect(error.details).toEqual(details);
	});

	it('should have empty details object when not provided', () => {
		const error = new SystemError('Test error');
		expect(error.details).toEqual({});
	});

	it('should log error when logging is "all"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new SystemError('Test error', {}, 'all');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should log error when logging is "error"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new SystemError('Test error', {}, 'error');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log error when logging is "warning"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new SystemError('Test error', {}, 'warning');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log error when logging is "info"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new SystemError('Test error', {}, 'info');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log error when logging is "none"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new SystemError('Test error', {}, 'none');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log error when logging is not provided', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new SystemError('Test error');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should handle case-insensitive logging', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new SystemError('Test error', {}, 'ALL');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should maintain stack trace', () => {
		const error = new SystemError('Test error');
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain('SystemError');
	});
});

