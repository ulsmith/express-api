import { jest } from '@jest/globals';
import Correlation from '../../Middleware/Correlation';
import CryptoTools from '../../Library/CryptoTools';
import { GlobalsType } from '../../Types/System';

const createGlobals = (): GlobalsType & { $client: { correlation?: { id: string; userId?: string; companyId?: string; impersonatorId?: string } } } => ({
	$environment: { NODE_ENV: 'test' },
	$client: {},
	$services: {},
	$socket: {} as any,
	$io: {} as any,
});

describe('Correlation', () => {
	beforeEach(() => {
		jest.spyOn(CryptoTools, 'generateUuid').mockReturnValue('test-correlation-id');
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('api mode', () => {
		it('should generate correlation on mount', async () => {
			const globals = createGlobals();
			const correlation = new Correlation(globals, 'api');
			const request = { headers: {} } as any;

			await correlation.mount(request);

			expect(globals.$client.correlation).toEqual({
				id: 'test-correlation-id',
				userId: '',
				companyId: '',
				impersonatorId: '',
			});
		});

		it('should not read headers on in', async () => {
			const globals = createGlobals();
			const correlation = new Correlation(globals, 'api');
			const request = {
				headers: { 'X-Correlation-Id': 'incoming-id' },
			} as any;

			await correlation.in(request);

			expect(globals.$client.correlation).toBeUndefined();
		});
	});

	describe('service mode', () => {
		it('should read correlation headers on in', async () => {
			const globals = createGlobals();
			const correlation = new Correlation(globals, 'service');
			const request = {
				headers: {
					'X-Correlation-Id': 'corr-1',
					'X-User-Id': 'user-1',
					'X-Company-Id': 'company-1',
					'X-Impersonator-Id': 'impersonator-1',
				},
			} as any;

			await correlation.in(request);

			expect(globals.$client.correlation).toEqual({
				id: 'corr-1',
				userId: 'user-1',
				companyId: 'company-1',
				impersonatorId: 'impersonator-1',
			});
		});

		it('should echo correlation headers on out', async () => {
			const globals = createGlobals();
			globals.$client.correlation = {
				id: 'corr-1',
				userId: 'user-1',
				companyId: 'company-1',
				impersonatorId: 'impersonator-1',
			};
			const correlation = new Correlation(globals, 'service');
			const response = { headers: {} } as any;

			const result = await correlation.out(response);

			expect(result.headers['X-Correlation-Id']).toBe('corr-1');
			expect(result.headers['X-User-Id']).toBe('user-1');
			expect(result.headers['X-Company-Id']).toBe('company-1');
			expect(result.headers['X-Impersonator-Id']).toBe('impersonator-1');
		});
	});
});
