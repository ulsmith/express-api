import Service from '../../Base/Service';
import Core from '../../System/Core';
import { GlobalsType } from '../../Types/System';

// Create a concrete implementation for testing
class TestService extends Service<GlobalsType> {
	// No additional methods needed for testing
}

const mockGlobals: GlobalsType = {
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
};

describe('Service', () => {
	it('should extend Core', () => {
		const service = new TestService(mockGlobals);
		expect(service).toBeInstanceOf(Core);
		expect(service).toBeInstanceOf(Service);
	});

	it('should have access to globals', () => {
		const service = new TestService(mockGlobals);
		expect(service.$globals).toBe(mockGlobals);
		expect(service.$environment).toBe(mockGlobals.$environment);
	});
});

