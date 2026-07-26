import { jest } from '@jest/globals';
import { Readable } from 'stream';
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

function encodeSse(...chunks: string[]): ReadableStream<Uint8Array> {
	const encoder = new TextEncoder();
	return new ReadableStream<Uint8Array>({
		start(controller) {
			for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
			controller.close();
		},
	});
}

async function collectStream<T>(stream: ReadableStream<T>): Promise<T[]> {
	const reader = stream.getReader();
	const items: T[] = [];
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		items.push(value);
	}
	return items;
}

describe('ExpressApiService', () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		(ExpressApiService as any).correlationWarningShown = false;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		jest.restoreAllMocks();
	});

	describe('fetch', () => {
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

		it('should retry errors with cause.code', async () => {
			const transientError = Object.assign(new Error('timeout'), { cause: { code: 'ETIMEDOUT' } });
			const mockFetch = jest.fn<typeof fetch>()
				.mockRejectedValueOnce(transientError)
				.mockResolvedValue({
					status: 200,
					body: {},
					json: async () => ({ ok: true }),
				} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());
			await expect(service.fetch('https://example.com/api', { method: 'get', body: '' })).resolves.toEqual({ ok: true });
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});

		it('should throw RestError after exhausting transient retries', async () => {
			const transientError = Object.assign(new Error('refused'), { code: 'ECONNREFUSED' });
			const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(transientError);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());

			await expect(service.fetch('https://example.com/api', { method: 'get', body: '' }))
				.rejects
				.toMatchObject({ name: 'RestError', status: 500 });
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});

		it('should throw RestError immediately for non-transient failures', async () => {
			const permanentError = Object.assign(new Error('boom'), { code: 'EPERM' });
			const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(permanentError);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());

			await expect(service.fetch('https://example.com/api', { method: 'get', body: '' }))
				.rejects
				.toBeInstanceOf(RestError);
			expect(mockFetch).toHaveBeenCalledTimes(1);
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

		it('should return empty body when response body is missing', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 204,
				body: null,
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());
			const result = await service.fetch('https://example.com/api', { method: 'get', body: '' });

			expect(result).toBeNull();
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

	describe('fetchEventStream', () => {
		it('should stream parsed SSE JSON chunks with correlation headers', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 200,
				body: encodeSse('data: {"n":1}\n', 'data: {"n":2}\n'),
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());
			const stream = service.fetchEventStream<{ n: number }>('https://example.com/stream', { method: 'post', body: '{}' });
			const items = await collectStream(stream);

			expect(items).toEqual([{ n: 1 }, { n: 2 }]);
			expect(mockFetch).toHaveBeenCalledWith('https://example.com/stream', expect.objectContaining({
				headers: expect.objectContaining({
					Accept: 'text/event-stream',
					'X-Correlation-Id': 'corr-1',
				}),
			}));
		});

		it('should skip invalid JSON SSE data lines', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 200,
				body: encodeSse('data: not-json\n', 'data: {"ok":true}\n', 'event: ping\n'),
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());
			const items = await collectStream(service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' }));

			expect(items).toEqual([{ ok: true }]);
		});

		it('should support Node Readable response bodies', async () => {
			const nodeBody = Readable.from([Buffer.from('data: {"via":"node"}\n')]);
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 200,
				body: nodeBody,
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());
			const items = await collectStream(service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' }));

			expect(items).toEqual([{ via: 'node' }]);
		});

		it('should error the stream when body cannot be converted to a readable stream', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 200,
				body: {},
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());

			await expect(collectStream(service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' })))
				.rejects
				.toBeTruthy();
		});

		it('should error the stream when HTTP status is >= 400 with JSON string body', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 400,
				statusText: 'Bad Request',
				body: {},
				json: async () => 'bad request',
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());
			const stream = service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' });

			await expect(collectStream(stream)).rejects.toMatchObject({ name: 'RestError', status: 400, message: 'bad request' });
		});

		it('should error the stream when HTTP status is >= 400 with JSON object body', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 502,
				statusText: 'Bad Gateway',
				body: {},
				json: async () => ({ error: 'upstream' }),
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());

			await expect(collectStream(service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' })))
				.rejects
				.toMatchObject({ name: 'RestError', status: 502, message: '{"error":"upstream"}' });
		});

		it('should fall back to response text when JSON parse fails on error responses', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 500,
				statusText: 'Internal Server Error',
				body: {},
				json: async () => { throw new Error('not json'); },
				text: async () => 'plain failure',
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());

			await expect(collectStream(service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' })))
				.rejects
				.toMatchObject({ name: 'RestError', message: 'plain failure' });
		});

		it('should fall back to statusText when json and text both fail', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 503,
				statusText: 'Service Unavailable',
				body: {},
				json: async () => { throw new Error('not json'); },
				text: async () => { throw new Error('no text'); },
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());

			await expect(collectStream(service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' })))
				.rejects
				.toMatchObject({ name: 'RestError', message: 'Error 503: Service Unavailable' });
		});

		it('should error the stream when response body is empty', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockResolvedValue({
				status: 200,
				body: null,
			} as any);
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());

			await expect(collectStream(service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' })))
				.rejects
				.toMatchObject({ name: 'RestError', message: 'Response body is empty' });
		});

		it('should error the stream when fetch itself fails', async () => {
			const mockFetch = jest.fn<typeof fetch>().mockRejectedValue(new Error('network down'));
			global.fetch = mockFetch;

			const service = new TestExpressApiService(createGlobals());

			await expect(collectStream(service.fetchEventStream('https://example.com/stream', { method: 'get', body: '' })))
				.rejects
				.toMatchObject({ name: 'RestError', status: 500 });
		});
	});
});
