import Controller from '../../Base/Controller';
import Core from '../../System/Core';
import { GlobalsType } from '../../Types/System';

// Create a concrete implementation for testing
class TestController extends Controller<GlobalsType> {
	// No additional methods needed for testing
}

const mockGlobals: GlobalsType = {
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
};

describe('Controller', () => {
	it('should extend Core', () => {
		const controller = new TestController(mockGlobals);
		expect(controller).toBeInstanceOf(Core);
		expect(controller).toBeInstanceOf(Controller);
	});

	it('should have access to globals', () => {
		const controller = new TestController(mockGlobals);
		expect(controller.$globals).toBe(mockGlobals);
		expect(controller.$environment).toBe(mockGlobals.$environment);
		expect(controller.$client).toBe(mockGlobals.$client);
	});
});

