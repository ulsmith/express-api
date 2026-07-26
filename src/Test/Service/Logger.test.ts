import { jest } from '@jest/globals';
import Logger from '../../Service/Logger';
import { GlobalsType } from '../../Types/System';

const createGlobals = (logging = 'all'): GlobalsType & { $client: { correlation?: { id: string }; controller?: { zodSchema?: Record<string, any> } } } => ({
	$environment: { NODE_ENV: 'test', EAPI_LOGGING: logging },
	$client: { correlation: { id: 'corr-1' } },
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

	it('should log to console when EAPI_LOGGING is all', async () => {
		const logger = new Logger(createGlobals('all'));

		await logger.log('info', 'Test', { dump: { secret: 'value' } });

		expect(consoleSpy).toHaveBeenCalled();
		expect(consoleSpy.mock.calls.some((call: unknown[]) => String(call[0]).includes('LOG [info, Test, corr-1]'))).toBe(true);
	});

	it('should respect EAPI_LOGGING error level', async () => {
		const logger = new Logger(createGlobals('error'));

		await logger.log('info', 'Hidden');
		await logger.log('error', 'Visible');

		expect(consoleSpy).toHaveBeenCalledTimes(1);
		expect(String(consoleSpy.mock.calls[0][0])).toContain('LOG [error, Visible');
	});

	it('should log requests and responses', async () => {
		const logger = new Logger(createGlobals('all'));

		await logger.logRequest({ path: '/test', method: 'get', headers: {}, body: { id: 1 } } as any);
		await logger.logResponse({ path: '/test', method: 'get', status: 200, headers: {}, body: { ok: true } } as any);

		expect(consoleSpy).toHaveBeenCalledTimes(2);
		expect(String(consoleSpy.mock.calls[0][0])).toContain('Request');
		expect(String(consoleSpy.mock.calls[1][0])).toContain('Response Info');
	});

	it('should allow subclasses to override write', async () => {
		type TestGlobals = ReturnType<typeof createGlobals>;

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
