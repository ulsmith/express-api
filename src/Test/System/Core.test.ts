import Core from '../../System/Core';
import { GlobalsType } from '../../Types/System';

// Create a concrete implementation for testing
class TestCore extends Core<GlobalsType> {
	// No additional methods needed for testing
}

describe('Core', () => {
	const mockGlobals: GlobalsType = {
		$environment: { NODE_ENV: 'test' },
		$client: { id: 'test-client' },
		$services: { testService: {} },
		$socket: {} as any,
		$io: {} as any,
	};

	it('should throw error when globals is not provided', () => {
		expect(() => {
			new TestCore(null as any);
		}).toThrow('Must pass in globals object');
	});

	it('should throw error when globals is undefined', () => {
		expect(() => {
			new TestCore(undefined as any);
		}).toThrow('Must pass in globals object');
	});

	it('should initialize with valid globals', () => {
		const core = new TestCore(mockGlobals);
		expect(core).toBeInstanceOf(Core);
	});

	it('should provide access to globals via $globals getter', () => {
		const core = new TestCore(mockGlobals);
		expect(core.$globals).toBe(mockGlobals);
	});

	it('should provide access to environment via $environment getter', () => {
		const core = new TestCore(mockGlobals);
		expect(core.$environment).toBe(mockGlobals.$environment);
		expect(core.$environment.NODE_ENV).toBe('test');
	});

	it('should provide access to client via $client getter', () => {
		const core = new TestCore(mockGlobals);
		expect(core.$client).toBe(mockGlobals.$client);
		expect(core.$client.id).toBe('test-client');
	});

	it('should provide access to services via $services getter', () => {
		const core = new TestCore(mockGlobals);
		expect(core.$services).toBe(mockGlobals.$services);
		expect(core.$services.testService).toBeDefined();
	});

	it('should provide access to socket via $socket getter', () => {
		const core = new TestCore(mockGlobals);
		expect(core.$socket).toBe(mockGlobals.$socket);
	});

	it('should provide access to io via $io getter', () => {
		const core = new TestCore(mockGlobals);
		expect(core.$io).toBe(mockGlobals.$io);
	});

	it('should maintain reference to original globals object', () => {
		const core = new TestCore(mockGlobals);
		mockGlobals.$environment.NODE_ENV = 'production';
		expect(core.$environment.NODE_ENV).toBe('production');
	});
});

