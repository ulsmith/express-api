import { jest } from '@jest/globals';
import ModelError from '../../Error/Model';

describe('ModelError', () => {
	it('should create error with message', () => {
		const error = new ModelError('Validation failed');
		expect(error).toBeInstanceOf(Error);
		expect(error).toBeInstanceOf(ModelError);
		expect(error.message).toBe('Validation failed');
		expect(error.name).toBe('ModelError');
		expect(error.exception).toBe(true);
	});

	it('should create error with message and details', () => {
		const details = { field: 'email', reason: 'invalid format' };
		const error = new ModelError('Validation failed', details);
		expect(error.message).toBe('Validation failed');
		expect(error.details).toEqual(details);
	});

	it('should have empty details object when not provided', () => {
		const error = new ModelError('Test error');
		expect(error.details).toEqual({});
	});

	it('should log error when logging is "all"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new ModelError('Test error', {}, 'all');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should log error when logging is "error"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new ModelError('Test error', {}, 'error');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log error when logging is "warning"', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new ModelError('Test error', {}, 'warning');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should not log error when logging is not provided', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new ModelError('Test error');
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should handle case-insensitive logging', () => {
		const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
		new ModelError('Test error', {}, 'ERROR');
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it('should maintain stack trace', () => {
		const error = new ModelError('Test error');
		expect(error.stack).toBeDefined();
		expect(error.stack).toContain('ModelError');
	});
});

