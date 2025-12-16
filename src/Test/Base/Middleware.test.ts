import Middleware from '../../Base/Middleware';
import Core from '../../System/Core';
import { GlobalsType } from '../../Types/System';

// Create a concrete implementation for testing
class TestMiddleware extends Middleware<GlobalsType> {
	// No additional methods needed for testing
}

const mockGlobals: GlobalsType = {
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
};

describe('Middleware', () => {
	it('should extend Core', () => {
		const middleware = new TestMiddleware(mockGlobals);
		expect(middleware).toBeInstanceOf(Core);
		expect(middleware).toBeInstanceOf(Middleware);
	});

	it('should have access to globals', () => {
		const middleware = new TestMiddleware(mockGlobals);
		expect(middleware.$globals).toBe(mockGlobals);
		expect(middleware.$environment).toBe(mockGlobals.$environment);
	});
});

