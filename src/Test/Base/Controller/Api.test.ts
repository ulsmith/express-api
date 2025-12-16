import { jest } from '@jest/globals';
import Api from '../../../Base/Controller/Api';
import Request from '../../../System/Request';
import SchemaTools from '../../../Library/SchemaTools';
import RestError from '../../../Error/Rest';
import { GlobalsType } from '../../../Types/System';
import { SwaggerSchemaMethodType } from '../../../Types/Swagger';

// Create a concrete implementation for testing
class TestApi extends Api<GlobalsType> {
	public options() {
		return {
			get: {
				parameters: [
					{
						name: 'id',
						in: 'path' as const,
						required: true,
						schema: { type: 'string' }
					}
				],
				responses: {
					200: {
						content: {
							'application/json': {
								schema: { type: 'object' }
							}
						}
					}
				}
			},
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
			},
			put: {
				parameters: [
					{
						name: 'id',
						in: 'query' as const,
						required: false,
						schema: { type: 'string' }
					}
				],
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

	// Expose methods for testing
	public async get(request: Request) {
		return { body: { id: 'test' }, status: 200 };
	}

	public async post(request: Request) {
		return { body: { created: true }, status: 201 };
	}

	public async put(request: Request) {
		return { body: { updated: true }, status: 200 };
	}

	public async patch(request: Request) {
		return { body: { patched: true }, status: 200 };
	}

	public async delete(request: Request) {
		return { body: { deleted: true }, status: 200 };
	}
}

const mockGlobals: GlobalsType = {
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
};

describe('Api', () => {
	let api: TestApi;
	let mockRequest: Request;

	beforeEach(() => {
		api = new TestApi(mockGlobals);
		mockRequest = {
			body: { name: 'test' },
			parameters: {
				path: { id: '123' },
				query: { id: '456' }
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

			const result = api.parseBody(mockRequest, 'post');
			expect(result).toEqual(mockBody);
			expect(SchemaTools.parseBody).toHaveBeenCalledWith(
				mockRequest,
				api.options().post,
				expect.stringContaining('TestApi:post:')
			);
		});


		it('should throw RestError on schema validation error', () => {
			jest.spyOn(SchemaTools, 'parseBody').mockImplementation(() => {
				throw new Error('Validation failed');
			});

			expect(() => api.parseBody(mockRequest, 'post')).toThrow(RestError);
			expect(() => api.parseBody(mockRequest, 'post')).toThrow('Validation failed');
		});
	});

	describe('parsePathParameters', () => {
		it('should parse path parameters successfully', () => {
			const mockParams = { id: '123' };
			jest.spyOn(SchemaTools, 'parsePathParameters').mockReturnValue(mockParams as any);

			const result = api.parsePathParameters(mockRequest, 'get');
			expect(result).toEqual(mockParams);
			expect(SchemaTools.parsePathParameters).toHaveBeenCalledWith(
				mockRequest,
				api.options().get,
				expect.stringContaining('TestApi:get:')
			);
		});

		it('should throw RestError on validation error', () => {
			jest.spyOn(SchemaTools, 'parsePathParameters').mockImplementation(() => {
				throw new Error('Path parameter validation failed');
			});

			expect(() => api.parsePathParameters(mockRequest, 'get')).toThrow(RestError);
			expect(() => api.parsePathParameters(mockRequest, 'get')).toThrow('Path parameter validation failed');
		});
	});

	describe('parseQueryParameters', () => {
		it('should parse query parameters successfully', () => {
			const mockParams = { id: '456' };
			jest.spyOn(SchemaTools, 'parseQueryParameters').mockReturnValue(mockParams as any);

			const result = api.parseQueryParameters(mockRequest, 'put');
			expect(result).toEqual(mockParams);
			expect(SchemaTools.parseQueryParameters).toHaveBeenCalledWith(
				mockRequest,
				api.options().put,
				expect.stringContaining('TestApi:put:')
			);
		});

		it('should throw RestError on validation error', () => {
			jest.spyOn(SchemaTools, 'parseQueryParameters').mockImplementation(() => {
				throw new Error('Query parameter validation failed');
			});

			expect(() => api.parseQueryParameters(mockRequest, 'put')).toThrow(RestError);
			expect(() => api.parseQueryParameters(mockRequest, 'put')).toThrow('Query parameter validation failed');
		});
	});

	describe('parseOutput', () => {
		it('should parse output successfully', () => {
			const mockOutput = { result: 'success' };
			jest.spyOn(SchemaTools, 'parseOutput').mockReturnValue(mockOutput as any);

			const result = api.parseOutput({ data: 'test' }, 'post');
			expect(result).toEqual(mockOutput);
			expect(SchemaTools.parseOutput).toHaveBeenCalledWith(
				{ data: 'test' },
				api.options().post,
				expect.stringContaining('TestApi:post:')
			);
		});

		it('should throw RestError on validation error', () => {
			jest.spyOn(SchemaTools, 'parseOutput').mockImplementation(() => {
				throw new Error('Output validation failed');
			});

			expect(() => api.parseOutput({ data: 'test' }, 'post')).toThrow(RestError);
			expect(() => api.parseOutput({ data: 'test' }, 'post')).toThrow('Output validation failed');
		});
	});

	describe('getCallingMethod', () => {
		it('should work when method is explicitly provided', () => {
			const mockBody = { name: 'test' };
			jest.spyOn(SchemaTools, 'parseBody').mockReturnValue(mockBody as any);

			const result = api.parseBody(mockRequest, 'post');
			expect(result).toEqual(mockBody);
			// When method is provided, getCallingMethod is bypassed
		});

		it('should detect method from stack when called from HTTP method', async () => {
			// When called from within a method named get/post/put/patch/delete,
			// getCallingMethod should detect it from the stack trace
			const mockOutput = { success: true };
			jest.spyOn(SchemaTools, 'parseOutput').mockReturnValue(mockOutput as any);

			// Calling from the 'get' method - should auto-detect 'get'
			const result = await api.get(mockRequest);
			expect(result).toEqual({ body: { id: 'test' }, status: 200 });
		});

		it('should throw when method cannot be determined from stack', () => {
			// Directly calling getCallingMethod from test context (no HTTP method in stack)
			// should throw because no get/post/put/patch/delete in stack trace
			expect(() => (api as any).getCallingMethod()).toThrow('Could not determine HTTP method');
		});
	});
});
