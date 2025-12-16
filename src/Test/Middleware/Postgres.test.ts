import { jest } from '@jest/globals';
import Postgres from '../../Middleware/Postgres';
import Core from '../../System/Core';
import { GlobalsType } from '../../Types/System';

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
	console.log = jest.fn();
});

afterAll(() => {
	console.log = originalConsoleLog;
});

const createMockGlobals = (): GlobalsType => ({
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
});

describe('Postgres', () => {
	let mockGlobals: GlobalsType;

	beforeEach(() => {
		mockGlobals = createMockGlobals();
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should extend Core', () => {
			const postgres = new Postgres(mockGlobals);
			expect(postgres).toBeInstanceOf(Core);
			expect(postgres).toBeInstanceOf(Postgres);
		});
	});

	describe('start', () => {
		it('should return request when no postgres services', async () => {
			const postgres = new Postgres(mockGlobals);
			const request = { method: 'GET', url: '/test' };

			const result = await postgres.start(request);

			expect(result).toBe(request);
		});

		it('should connect to all postgres services', async () => {
			const mockConnect1 = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
			const mockConnect2 = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

			mockGlobals.$services = {
				'postgres:service1': {
					name: 'postgres',
					connect: mockConnect1
				},
				'postgres:service2': {
					name: 'postgres',
					connect: mockConnect2
				},
				'other:service': {
					name: 'other',
					connect: jest.fn()
				}
			};

			const postgres = new Postgres(mockGlobals);
			const request = { method: 'GET', url: '/test' };

			const result = await postgres.start(request);

			expect(mockConnect1).toHaveBeenCalled();
			expect(mockConnect2).toHaveBeenCalled();
			expect(result).toBe(request);
		});

		it('should handle connection errors gracefully', async () => {
			const error = new Error('Connection failed');
			const mockConnect = jest.fn<() => Promise<void>>().mockRejectedValue(error);

			mockGlobals.$services = {
				'postgres:service1': {
					name: 'postgres',
					connect: mockConnect
				}
			};

			const postgres = new Postgres(mockGlobals);
			const request = { method: 'GET', url: '/test' };

			const result = await postgres.start(request);

			expect(mockConnect).toHaveBeenCalled();
			expect(console.log).toHaveBeenCalledWith(
				'Check ALL connection settings: ' + error.message,
				expect.any(String)
			);
			expect(result).toBe(request);
		});

		it('should handle multiple services with mixed success and errors', async () => {
			const mockConnect1 = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
			const error = new Error('Connection failed');
			const mockConnect2 = jest.fn<() => Promise<void>>().mockRejectedValue(error);

			mockGlobals.$services = {
				'postgres:service1': {
					name: 'postgres',
					connect: mockConnect1
				},
				'postgres:service2': {
					name: 'postgres',
					connect: mockConnect2
				}
			};

			const postgres = new Postgres(mockGlobals);
			const request = { method: 'GET', url: '/test' };

			const result = await postgres.start(request);

			expect(mockConnect1).toHaveBeenCalled();
			expect(mockConnect2).toHaveBeenCalled();
			expect(result).toBe(request);
		});
	});

	describe('end', () => {
		it('should return response when no postgres services', async () => {
			const postgres = new Postgres(mockGlobals);
			const response = { status: 200, body: { data: 'test' } };

			const result = await postgres.end(response);

			expect(result).toBe(response);
		});

		it('should disconnect from all postgres services', async () => {
			const mockEnd1 = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
			const mockEnd2 = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

			mockGlobals.$services = {
				'postgres:service1': {
					name: 'postgres',
					end: mockEnd1
				},
				'postgres:service2': {
					name: 'postgres',
					end: mockEnd2
				},
				'other:service': {
					name: 'other',
					end: jest.fn()
				}
			};

			const postgres = new Postgres(mockGlobals);
			const response = { status: 200, body: { data: 'test' } };

			const result = await postgres.end(response);

			expect(mockEnd1).toHaveBeenCalled();
			expect(mockEnd2).toHaveBeenCalled();
			expect(result).toBe(response);
		});

		it('should handle disconnection errors gracefully', async () => {
			const error = new Error('Disconnection failed');
			const mockEnd = jest.fn<() => Promise<void>>().mockRejectedValue(error);

			mockGlobals.$services = {
				'postgres:service1': {
					name: 'postgres',
					end: mockEnd
				}
			};

			const postgres = new Postgres(mockGlobals);
			const response = { status: 200, body: { data: 'test' } };

			const result = await postgres.end(response);

			expect(mockEnd).toHaveBeenCalled();
			expect(console.log).toHaveBeenCalledWith(
				'Check ALL connection settings: ' + error.message,
				expect.any(String)
			);
			expect(result).toBe(response);
		});

		it('should handle multiple services with mixed success and errors', async () => {
			const mockEnd1 = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
			const error = new Error('Disconnection failed');
			const mockEnd2 = jest.fn<() => Promise<void>>().mockRejectedValue(error);

			mockGlobals.$services = {
				'postgres:service1': {
					name: 'postgres',
					end: mockEnd1
				},
				'postgres:service2': {
					name: 'postgres',
					end: mockEnd2
				}
			};

			const postgres = new Postgres(mockGlobals);
			const response = { status: 200, body: { data: 'test' } };

			const result = await postgres.end(response);

			expect(mockEnd1).toHaveBeenCalled();
			expect(mockEnd2).toHaveBeenCalled();
			expect(result).toBe(response);
		});
	});
});
