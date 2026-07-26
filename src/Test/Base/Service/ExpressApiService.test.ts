import { jest } from '@jest/globals';
import ExpressApiService from '../../../Base/Service/ExpressApiService';
import RestError from '../../../Error/Rest';
import { GlobalsType } from '../../../Types/System';

class TestExpressApiService extends ExpressApiService<GlobalsType & { $client: { correlation?: { id: string; userId?: string; companyId?: string; impersonatorId?: string } } }> {
	public service = 'test';
}

const createGlobals = () => ({
	$environment: { NODE_ENV: 'test' },
	$client: {
		correlation: {
			id: 'corr-1',
			userId: 'user-1',
			companyId: 'company-1',
			impersonatorId: 'impersonator-1',
		},
	},
	$services: {},
	$socket: {} as any,
	$io: {} as any,
});

describe('ExpressApiService', () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		(ExpressApiService as any).correlationWarningShown = false;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	it('should inject correlation headers on fetch', async () => {
		const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
			status: 200,
			body: {},
			json: async () => ({ ok: true }),
		} as any);
		global.fetch = mockFetch;

		const service = new TestExpressApiService(createGlobals());
		const result = await service.fetch('https://example.com/api', { method: 'post', body: '{}' });

		expect(result).toEqual({ ok: true });
		expect(mockFetch).toHaveBeenCalledWith('https://example.com/api', expect.objectContaining({
			headers: expect.objectContaining({
				'X-Correlation-Id': 'corr-1',
				'X-User-Id': 'user-1',
				'X-Company-Id': 'company-1',
				'X-Impersonator-Id': 'impersonator-1',
			}),
		}));
	});

	it('should retry transient fetch failures', async () => {
		const transientError = Object.assign(new Error('reset'), { code: 'ECONNRESET' });
		const mockFetch = jest.fn<typeof fetch>()
			.mockRejectedValueOnce(transientError)
			.mockResolvedValue({
				status: 200,
				body: {},
				json: async () => ({ ok: true }),
			} as any);
		global.fetch = mockFetch;

		const service = new TestExpressApiService(createGlobals());
		const result = await service.fetch('https://example.com/api', { method: 'get', body: '' });

		expect(result).toEqual({ ok: true });
		expect(mockFetch).toHaveBeenCalledTimes(2);
	});

	it('should throw RestError on HTTP error responses', async () => {
		const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
			status: 500,
			body: {},
			json: async () => 'server error',
		} as any);
		global.fetch = mockFetch;

		const service = new TestExpressApiService(createGlobals());

		await expect(service.fetch('https://example.com/api', { method: 'get', body: '' }))
			.rejects
			.toBeInstanceOf(RestError);
	});

	it('should warn once when Correlation middleware has not set $client.correlation', async () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
			status: 200,
			body: {},
			json: async () => ({ ok: true }),
		} as any);
		global.fetch = mockFetch;

		const globals = {
			$environment: { NODE_ENV: 'test' },
			$client: {},
			$services: {},
			$socket: {} as any,
			$io: {} as any,
		};
		const service = new TestExpressApiService(globals);

		await service.fetch('https://example.com/api', { method: 'get', body: '' });
		await service.fetch('https://example.com/api', { method: 'get', body: '' });

		expect(warnSpy).toHaveBeenCalledTimes(1);
		expect(String(warnSpy.mock.calls[0][0])).toContain('Correlation middleware');
		expect(mockFetch).toHaveBeenCalledWith('https://example.com/api', expect.objectContaining({
			headers: expect.objectContaining({
				'X-Correlation-Id': '00000000-0000-0000-0000-000000000000',
			}),
		}));
	});

	it('should not warn when correlation is present', async () => {
		const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
		const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
			status: 200,
			body: {},
			json: async () => ({ ok: true }),
		} as any);
		global.fetch = mockFetch;

		const service = new TestExpressApiService(createGlobals());
		await service.fetch('https://example.com/api', { method: 'get', body: '' });

		expect(warnSpy).not.toHaveBeenCalled();
	});
});
