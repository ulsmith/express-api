import { jest } from '@jest/globals';
import Service from '../../../Base/Controller/Service';
import Request from '../../../System/Request';
import SchemaTools from '../../../Library/SchemaTools';
import RestError from '../../../Error/Rest';
import { GlobalsType } from '../../../Types/System';

// Create a concrete implementation for testing
class TestService extends Service<GlobalsType> {
	public options() {
		return {
			post: {
				requestBody: {
					content: {
						'application/json': {
							schema: { type: 'object' }
						}
					}
				},
				responses: {
					200: {
						content: {
							'application/json': {
								schema: { type: 'object' }
							}
						}
					}
				}
			}
		} as any;
	}

	public async post(request: Request) {
		return { body: { created: true }, status: 201 };
	}
}

const mockGlobals: GlobalsType = {
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
};

describe('Service', () => {
	let service: TestService;
	let mockRequest: Request;

	beforeEach(() => {
		service = new TestService(mockGlobals);
		mockRequest = {
			body: { name: 'test' },
			parameters: {
				path: {},
				query: {}
			},
			headers: {},
			method: 'post',
			path: '/test',
			resource: { path: '/test' },
			context: {},
			access: {},
			type: 'express',
			source: 'route',
			requests: []
		} as any;
	});

	describe('parseBody', () => {
		it('should parse body successfully', () => {
			const mockBody = { name: 'test' };
			jest.spyOn(SchemaTools, 'parseBody').mockReturnValue(mockBody as any);

			const result = service.parseBody(mockRequest);
			expect(result).toEqual(mockBody);
			expect(SchemaTools.parseBody).toHaveBeenCalledWith(
				mockRequest,
				service.options().post,
				expect.stringContaining('TestService:post:')
			);
		});

		it('should throw RestError on schema validation error', () => {
			jest.spyOn(SchemaTools, 'parseBody').mockImplementation(() => {
				throw new Error('Validation failed');
			});

			expect(() => service.parseBody(mockRequest)).toThrow(RestError);
			expect(() => service.parseBody(mockRequest)).toThrow('Validation failed');
		});

		it('should use post schema from options', () => {
			const mockBody = { name: 'test' };
			jest.spyOn(SchemaTools, 'parseBody').mockReturnValue(mockBody as any);

			service.parseBody(mockRequest);
			
			const callArgs = (SchemaTools.parseBody as jest.Mock).mock.calls[0];
			expect(callArgs[1]).toStrictEqual(service.options().post);
		});
	});

	describe('parseOutput', () => {
		it('should parse output successfully', () => {
			const mockOutput = { result: 'success' };
			jest.spyOn(SchemaTools, 'parseOutput').mockReturnValue(mockOutput as any);

			const result = service.parseOutput({ data: 'test' });
			expect(result).toEqual(mockOutput);
			expect(SchemaTools.parseOutput).toHaveBeenCalledWith(
				{ data: 'test' },
				service.options().post,
				expect.stringContaining('TestService:post:')
			);
		});

		it('should throw RestError on validation error', () => {
			jest.spyOn(SchemaTools, 'parseOutput').mockImplementation(() => {
				throw new Error('Output validation failed');
			});

			expect(() => service.parseOutput({ data: 'test' })).toThrow(RestError);
			expect(() => service.parseOutput({ data: 'test' })).toThrow('Output validation failed');
		});

		it('should use post schema from options', () => {
			const mockOutput = { result: 'success' };
			jest.spyOn(SchemaTools, 'parseOutput').mockReturnValue(mockOutput as any);

			service.parseOutput({ data: 'test' });
			
			const callArgs = (SchemaTools.parseOutput as jest.Mock).mock.calls[0];
			expect(callArgs[1]).toStrictEqual(service.options().post);
		});
	});
});
