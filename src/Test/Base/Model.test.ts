import Model from '../../Base/Model';
import Core from '../../System/Core';
import { GlobalsType } from '../../Types/System';

// Create a concrete implementation for testing
class TestModel extends Model<GlobalsType> {
	// No additional methods needed for testing
}

const mockGlobals: GlobalsType = {
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
};

describe('Model', () => {
	it('should extend Core', () => {
		const model = new TestModel(mockGlobals);
		expect(model).toBeInstanceOf(Core);
		expect(model).toBeInstanceOf(Model);
	});

	it('should have access to globals', () => {
		const model = new TestModel(mockGlobals);
		expect(model.$globals).toBe(mockGlobals);
		expect(model.$environment).toBe(mockGlobals.$environment);
	});
});

