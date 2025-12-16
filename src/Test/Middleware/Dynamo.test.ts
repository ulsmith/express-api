import Dynamo from '../../Middleware/Dynamo';
import Core from '../../System/Core';
import { GlobalsType } from '../../Types/System';

const createMockGlobals = (): GlobalsType => ({
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
});

describe('Dynamo', () => {
	let mockGlobals: GlobalsType;

	beforeEach(() => {
		mockGlobals = createMockGlobals();
	});

	describe('constructor', () => {
		it('should extend Core', () => {
			const dynamo = new Dynamo(mockGlobals);
			expect(dynamo).toBeInstanceOf(Core);
			expect(dynamo).toBeInstanceOf(Dynamo);
		});
	});

	describe('start', () => {
		it('should return request when no dynamo services', async () => {
			const dynamo = new Dynamo(mockGlobals);
			const request = { method: 'GET', url: '/test' };

			const result = await dynamo.start(request);

			expect(result).toBe(request);
		});

		it('should collect all dynamo services', async () => {
			const service1 = { name: 'dynamo', dbname: 'db1' };
			const service2 = { name: 'dynamo', dbname: 'db2' };

			mockGlobals.$services = {
				'dynamo:service1': service1,
				'dynamo:service2': service2,
				'other:service': {
					name: 'other',
					dbname: 'other'
				}
			};

			const dynamo = new Dynamo(mockGlobals);
			const request = { method: 'GET', url: '/test' };

			const result = await dynamo.start(request);

			expect(result).toBe(request);
		});

		it('should handle empty services object', async () => {
			const dynamo = new Dynamo(mockGlobals);
			const request = { method: 'GET', url: '/test' };

			const result = await dynamo.start(request);

			expect(result).toBe(request);
		});

		it('should handle multiple dynamo services', async () => {
			const service1 = { name: 'dynamo', dbname: 'db1' };
			const service2 = { name: 'dynamo', dbname: 'db2' };
			const service3 = { name: 'dynamo', dbname: 'db3' };

			mockGlobals.$services = {
				'dynamo:service1': service1,
				'dynamo:service2': service2,
				'dynamo:service3': service3
			};

			const dynamo = new Dynamo(mockGlobals);
			const request = { method: 'GET', url: '/test' };

			const result = await dynamo.start(request);

			expect(result).toBe(request);
		});
	});
});
