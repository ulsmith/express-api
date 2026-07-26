import { jest } from '@jest/globals';
import { z } from 'zod';
import Logger from '../../Service/Logger';
import { GlobalsType } from '../../Types/System';

type TestGlobals = GlobalsType & {
	$client: {
		correlation?: { id: string };
		controller?: { zodSchema?: Record<string, any> };
	};
};

const createGlobals = (logging = 'all', extras: Partial<TestGlobals['$client']> = {}): TestGlobals => ({
	$environment: { NODE_ENV: 'test', EAPI_LOGGING: logging },
	$client: { correlation: { id: 'corr-1' }, ...extras },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
});

describe('Logger', () => {
	let consoleSpy: ReturnType<typeof jest.spyOn>;

	beforeEach(() => {
		consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('log', () => {
		it('should log to console when EAPI_LOGGING is all', async () => {
			const logger = new Logger(createGlobals('all'));

			await logger.log('info', 'Test', { dump: { secret: 'value' } });

			expect(consoleSpy.mock.calls.some((call: unknown[]) => String(call[0]).includes('LOG DUMP DATA DETECTED'))).toBe(true);
			expect(consoleSpy.mock.calls.some((call: unknown[]) => String(call[0]).includes('LOG [info, Test, corr-1]'))).toBe(true);
		});

		it('should default to all when EAPI_LOGGING is unset', async () => {
			const globals = createGlobals('all');
			delete globals.$environment.EAPI_LOGGING;
			const logger = new Logger(globals);

			await logger.log('info', 'Default');

			expect(consoleSpy).toHaveBeenCalled();
			expect(String(consoleSpy.mock.calls[0][0])).toContain('LOG [info, Default');
		});

		it('should respect EAPI_LOGGING info level', async () => {
			const logger = new Logger(createGlobals('info'));

			await logger.log('info', 'Info');
			await logger.log('warning', 'Warn');
			await logger.log('error', 'Err');

			expect(consoleSpy).toHaveBeenCalledTimes(3);
		});

		it('should respect EAPI_LOGGING warning level', async () => {
			const logger = new Logger(createGlobals('warning'));

			await logger.log('info', 'Hidden');
			await logger.log('warning', 'Warn');
			await logger.log('error', 'Err');

			expect(consoleSpy).toHaveBeenCalledTimes(2);
			expect(String(consoleSpy.mock.calls[0][0])).toContain('LOG [warning, Warn');
			expect(String(consoleSpy.mock.calls[1][0])).toContain('LOG [error, Err');
		});

		it('should respect EAPI_LOGGING error level', async () => {
			const logger = new Logger(createGlobals('error'));

			await logger.log('info', 'Hidden');
			await logger.log('error', 'Visible');

			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0][0])).toContain('LOG [error, Visible');
		});

		it('should not log for unknown EAPI_LOGGING values', async () => {
			const logger = new Logger(createGlobals('off'));

			await logger.log('error', 'Hidden');

			expect(consoleSpy).not.toHaveBeenCalled();
		});

		it('should include request, response and error in log data', async () => {
			const logger = new Logger(createGlobals('all'));

			await logger.log('error', 'Failed', {
				error: new Error('boom'),
				request: { path: '/a', method: 'post', headers: { a: '1' }, body: { password: 'secret' } } as any,
				response: { path: '/a', method: 'post', status: 500, headers: {}, body: { token: 'abc' } } as any,
			});

			const line = String(consoleSpy.mock.calls.find((call: unknown[]) => String(call[0]).includes('LOG [error, Failed'))?.[0]);
			expect(line).toContain('"path":"/a"');
			expect(line).toContain('"boom"');
		});

		it('should fall back to empty correlation id when missing', async () => {
			const globals = createGlobals('all');
			delete globals.$client.correlation;
			const logger = new Logger(globals);

			await logger.log('info', 'NoCorr');

			expect(String(consoleSpy.mock.calls[0][0])).toContain('LOG [info, NoCorr, ]');
		});
	});

	describe('logHandler', () => {
		it('should log info when there is no error', async () => {
			const logger = new Logger(createGlobals('all'));

			await logger.logHandler({
				request: { path: '/handler', method: 'get', headers: {}, body: { q: '1' } },
				response: { path: '/handler', method: 'get', status: 200, headers: {}, body: { ok: true } } as any,
			});

			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0][0])).toContain('LOG [info, Info, corr-1]');
			expect(String(consoleSpy.mock.calls[0][0])).toContain('/handler');
		});

		it('should log error when payload includes an error', async () => {
			const logger = new Logger(createGlobals('all'));

			await logger.logHandler({
				error: new Error('handler failed'),
			});

			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0][0])).toContain('LOG [error, Error, corr-1]');
			expect(String(consoleSpy.mock.calls[0][0])).toContain('handler failed');
		});

		it('should handle empty logHandler payload', async () => {
			const logger = new Logger(createGlobals('all'));

			await logger.logHandler();

			expect(consoleSpy).toHaveBeenCalledTimes(1);
			expect(String(consoleSpy.mock.calls[0][0])).toContain('LOG [info, Info, corr-1]');
		});
	});

	describe('logRequest / logResponse', () => {
		it('should log requests and successful responses', async () => {
			const logger = new Logger(createGlobals('all'));

			await logger.logRequest({ path: '/test', method: 'get', headers: {}, body: { id: 1 } } as any);
			await logger.logResponse({ path: '/test', method: 'get', status: 200, headers: {}, body: { ok: true } } as any);

			expect(consoleSpy).toHaveBeenCalledTimes(2);
			expect(String(consoleSpy.mock.calls[0][0])).toContain('Request');
			expect(String(consoleSpy.mock.calls[1][0])).toContain('Response Info');
		});

		it('should classify 4xx responses as warnings and 5xx as errors', async () => {
			const logger = new Logger(createGlobals('all'));

			await logger.logResponse({ path: '/x', method: 'get', status: 404, headers: {}, body: 'missing' } as any);
			await logger.logResponse({ path: '/x', method: 'get', status: 500, headers: {}, body: '{"fail":true}' } as any);

			expect(String(consoleSpy.mock.calls[0][0])).toContain('Response Warning');
			expect(String(consoleSpy.mock.calls[1][0])).toContain('Response Error');
		});

		it('should keep non-json string response bodies when parse fails', async () => {
			const logger = new Logger(createGlobals('all'));

			await logger.logResponse({ path: '/x', method: 'get', status: 200, headers: {}, body: 'not-json{' } as any);

			expect(String(consoleSpy.mock.calls[0][0])).toContain('not-json{');
		});

		it('should redact bodies using controller zod schemas', async () => {
			const logger = new Logger(createGlobals('all', {
				controller: {
					zodSchema: {
						post: {
							body: z.object({
								password: z.string().meta({ sensitive: true }),
								name: z.string(),
							}),
							response: {
								200: {
									schema: z.object({
										token: z.string().meta({ sensitive: true }),
										id: z.number(),
									}),
								},
							},
						},
					},
				},
			}));

			await logger.logRequest({ path: '/login', method: 'post', headers: {}, body: { password: 'secret', name: 'paul' } } as any);
			await logger.logResponse({ path: '/login', method: 'post', status: 200, headers: {}, body: { token: 'abc', id: 1 } } as any);

			expect(String(consoleSpy.mock.calls[0][0])).toContain('[REDACTED]');
			expect(String(consoleSpy.mock.calls[0][0])).toContain('paul');
			expect(String(consoleSpy.mock.calls[1][0])).toContain('[REDACTED]');
			expect(String(consoleSpy.mock.calls[1][0])).toContain('"id":1');
		});
	});

	describe('extension', () => {
		it('should allow subclasses to override write', async () => {
			class RemoteLogger extends Logger<TestGlobals> {
				public remoteLogs: Array<{ type: string; title: string }> = [];

				protected write(type: 'info' | 'warning' | 'error', title: string, _correlation: { id: string }, _data: Record<string, any>): void {
					this.remoteLogs.push({ type, title });
				}
			}

			const logger = new RemoteLogger(createGlobals('all'));
			await logger.log('info', 'Remote');

			expect(logger.remoteLogs).toEqual([{ type: 'info', title: 'Remote' }]);
			expect(consoleSpy).not.toHaveBeenCalled();
		});
	});
});
