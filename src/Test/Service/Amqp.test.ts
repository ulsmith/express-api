import { jest } from '@jest/globals';
import Amqp from '../../Service/Amqp';

describe('Amqp', () => {
	describe('constructor', () => {
		it('should set all properties correctly', () => {
			const amqp = new Amqp('test-alias', 'amqp://localhost', 5672, 'user', 'pass');

			expect(amqp.name).toBe('amqp');
			expect(amqp.service).toBe('amqp:test-alias');
			expect(amqp.alias).toBe('test-alias');
			expect(amqp.host).toBe('amqp://localhost');
			expect(amqp.port).toBe(5672);
			expect(amqp.amqp).toBeDefined();
		});

		it('should handle amqps protocol', () => {
			const amqp = new Amqp('secure-alias', 'amqps://secure.example.com', 5671, 'user', 'pass');

			expect(amqp.host).toBe('amqps://secure.example.com');
			expect(amqp.port).toBe(5671);
		});
	});

	describe('connect', () => {
		it('should throw error for invalid connection string', async () => {
			const amqp = new Amqp('test-alias', 'invalid-string', 5672, 'user', 'pass');

			await expect(amqp.connect()).rejects.toThrow('Invalid AMQP connection string');
		});

		it('should throw error for connection string without protocol separator', async () => {
			const amqp = new Amqp('test-alias', 'localhost', 5672, 'user', 'pass');

			await expect(amqp.connect()).rejects.toThrow('Invalid AMQP connection string');
		});

		it('should clear user and password after successful connection', async () => {
			const amqp = new Amqp('test-alias', 'amqp://localhost', 5672, 'user', 'pass');

			expect((amqp as any).user).toBe('user');
			expect((amqp as any).password).toBe('pass');

			// Mock the amqp.connect method
			const mockConnection = { close: jest.fn() };
			jest.spyOn(amqp.amqp, 'connect').mockResolvedValue(mockConnection as any);

			await amqp.connect();

			expect((amqp as any).user).toBeUndefined();
			expect((amqp as any).password).toBeUndefined();
			expect(amqp.connection).toBe(mockConnection);
		});

		it('should build connection string correctly', async () => {
			const amqp = new Amqp('test-alias', 'amqp://localhost', 5672, 'user', 'pass');

			const mockConnection = { close: jest.fn() };
			const connectSpy = jest.spyOn(amqp.amqp, 'connect').mockResolvedValue(mockConnection as any);

			await amqp.connect();

			expect(connectSpy).toHaveBeenCalledWith('amqp://user:pass@localhost:5672');
		});

		it('should handle amqps protocol', async () => {
			const amqp = new Amqp('secure-alias', 'amqps://secure.example.com', 5671, 'user', 'pass');

			const mockConnection = { close: jest.fn() };
			const connectSpy = jest.spyOn(amqp.amqp, 'connect').mockResolvedValue(mockConnection as any);

			await amqp.connect();

			expect(connectSpy).toHaveBeenCalledWith('amqps://user:pass@secure.example.com:5671');
		});

		it('should handle connection errors', async () => {
			const amqp = new Amqp('test-alias', 'amqp://localhost', 5672, 'user', 'pass');
			const error = new Error('Connection failed');
			jest.spyOn(amqp.amqp, 'connect').mockRejectedValue(error);

			await expect(amqp.connect()).rejects.toThrow('Connection failed');
		});
	});

	describe('end', () => {
		it('should close connection after timeout', async () => {
			const amqp = new Amqp('test-alias', 'amqp://localhost', 5672, 'user', 'pass');
			const mockClose = jest.fn();
			const mockConnection = { close: mockClose };
			jest.spyOn(amqp.amqp, 'connect').mockResolvedValue(mockConnection as any);
			await amqp.connect();

			jest.useFakeTimers();
			const endPromise = amqp.end();

			expect(mockClose).not.toHaveBeenCalled();

			jest.advanceTimersByTime(1);
			await endPromise;

			expect(mockClose).toHaveBeenCalled();
			jest.useRealTimers();
		});

		it('should return a promise that resolves after closing', async () => {
			const amqp = new Amqp('test-alias', 'amqp://localhost', 5672, 'user', 'pass');
			const mockClose = jest.fn();
			const mockConnection = { close: mockClose };
			jest.spyOn(amqp.amqp, 'connect').mockResolvedValue(mockConnection as any);
			await amqp.connect();

			jest.useFakeTimers();
			const endPromise = amqp.end();
			jest.advanceTimersByTime(1);
			const result = await endPromise;

			expect(result).toBeUndefined();
			expect(mockClose).toHaveBeenCalled();
			jest.useRealTimers();
		});
	});
});
