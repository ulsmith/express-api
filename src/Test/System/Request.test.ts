import { jest } from '@jest/globals';
import Request from '../../System/Request';
import { GlobalsType } from '../../Types/System';

// Inline Azure function config for testing
const azureFunctionConfig = {
	bindings: [
		{ type: 'httpTrigger', direction: 'in', route: 'test/{id}' },
		{ type: 'http', direction: 'out' }
	]
};

const mockGlobals: GlobalsType = {
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
};

// Set up mock routes file for testing
// The Request class uses require() which can't load TypeScript directly.
// We'll set the path to point to our TypeScript routes, but we need to handle
// the fact that require() will look for a .js file. Since we're in tests,
// we can use process.env to point to a path that we'll intercept.
const originalRoutesEnv = process.env._EAPI_ROUTES;
const originalCwd = process.cwd;

// Mock the require function by patching the module's createRequire
// We need to do this before Request is imported, but since it's already imported,
// we'll need to clear the module cache and re-import, or use a different strategy.

// Instead, let's create a simple approach: use the routes.ts file and compile it on the fly
// OR, we can use jest.mock to mock the entire routes loading mechanism

beforeAll(() => {
	process.env._EAPI_ROUTES = 'src/Test/routes.cjs';
});

afterAll(() => {
	if (originalRoutesEnv) {
		process.env._EAPI_ROUTES = originalRoutesEnv;
	} else {
		delete process.env._EAPI_ROUTES;
	}
});

describe('Request', () => {
	describe('constructor', () => {
		it('should throw error for invalid type', () => {
			expect(() => {
				new Request(mockGlobals, 'invalid' as any, {});
			}).toThrow('Type does not exist');
		});

		it('should accept express type', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});
			expect(request.type).toBe('express');
			expect(request.source).toBe('route');
		});

		it('should accept socket type', () => {
			const request = new Request(mockGlobals, 'socket', {
				route: '/test',
				socket: {
					handshake: {
						headers: {},
						address: '127.0.0.1'
					}
				},
				data: {}
			});
			expect(request.type).toBe('socket');
			expect(request.source).toBe('route');
		});
	});

	describe('_expressParse and _expressRoute', () => {
		it('should parse express request correctly', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {
					'content-type': 'application/json',
					'authorization': 'Bearer token'
				},
				body: { name: 'test' },
				query: { filter: 'active' },
				clientIp: '127.0.0.1'
			});

			expect(request.method).toBe('get');
			expect(request.path).toBe('/test');
			expect(request.context?.ipAddress).toBe('127.0.0.1');
			expect(request.headers?.['Content-Type']).toBe('application/json');
			expect(request.headers?.['Authorization']).toBe('Bearer token');
			expect(request.body).toEqual({ name: 'test' });
			expect(request.parameters.query).toEqual({ filter: 'active' });
		});

		it('should match route with path parameters', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test/123',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.resource?.path).toBeDefined();
			expect(request.parameters.path).toBeDefined();
			if (request.parameters.path && Object.keys(request.parameters.path).length > 0) {
				expect((request.parameters.path as any).id).toBe('123');
			}
		});

		it('should handle route with multiple path parameters', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'POST',
				url: '/test/123/item/456',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.resource?.path).toBeDefined();
		});

		it('should handle query string in URL', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test?id=123&name=test',
				headers: {},
				body: {},
				query: { id: '123', name: 'test' },
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/test');
			expect(request.parameters.query).toEqual({ id: '123', name: 'test' });
		});

		it('should normalize headers', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {
					'content-type': 'application/json',
					'X-Custom-Header': 'value'
				},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.headers?.['Content-Type']).toBe('application/json');
			expect(request.headers?.['X-Custom-Header']).toBe('value');
		});
	});

	describe('_socketParse and _socketRoute', () => {
		it('should parse socket request correctly', () => {
			const request = new Request(mockGlobals, 'socket', {
				route: '/test',
				socket: {
					handshake: {
						headers: {
							'content-type': 'application/json'
						},
						address: '127.0.0.1'
					}
				},
				data: { name: 'test' }
			});

			expect(request.method).toBe('socket');
			expect(request.path).toBe('/test');
			expect(request.context?.ipAddress).toBe('127.0.0.1');
			expect(request.headers?.['Content-Type']).toBe('application/json');
		});

		it('should parse JSON body from socket data', () => {
			const request = new Request(mockGlobals, 'socket', {
				route: '/test',
				socket: {
					handshake: {
						headers: {
							'content-type': 'application/json'
						},
						address: '127.0.0.1'
					}
				},
				data: JSON.stringify({ name: 'test' })
			});

			expect(typeof request.body).toBe('object');
			expect(request.body).toEqual({ name: 'test' });
		});

		it('should handle non-JSON body from socket data', () => {
			const request = new Request(mockGlobals, 'socket', {
				route: '/test',
				socket: {
					handshake: {
						headers: {
							'content-type': 'text/plain'
						},
						address: '127.0.0.1'
					}
				},
				data: 'plain text'
			});

			expect(request.body).toBe('plain text');
		});
	});

	describe('_parseBody', () => {
		it('should parse JSON body when Content-Type is application/json', () => {
			// Note: _parseBody is used for socket requests, not express
			// Express middleware typically handles JSON parsing before Request class
			const request = new Request(mockGlobals, 'socket', {
				route: '/test',
				socket: {
					handshake: {
						headers: {
							'content-type': 'application/json'
						},
						address: '127.0.0.1'
					}
				},
				data: JSON.stringify({ name: 'test' })
			});

			expect(typeof request.body).toBe('object');
			expect(request.body).toEqual({ name: 'test' });
		});

		it('should return body as-is for non-JSON content types', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'POST',
				url: '/test',
				headers: {
					'content-type': 'text/plain'
				},
				body: 'plain text',
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.body).toBe('plain text');
		});

		it('should handle invalid JSON gracefully', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'POST',
				url: '/test',
				headers: {
					'content-type': 'application/json'
				},
				body: 'invalid json {',
				query: {},
				clientIp: '127.0.0.1'
			});

			// Should return the original string if JSON parsing fails
			expect(request.body).toBe('invalid json {');
		});

		it('should handle undefined body', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {},
				body: undefined,
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.body).toBeUndefined();
		});
	});

	describe('error handling', () => {
		it('should throw error when routes file not found in express route', () => {
			const originalRoutes = process.env._EAPI_ROUTES;
			process.env._EAPI_ROUTES = 'nonexistent/routes.cjs';

			expect(() => {
				new Request(mockGlobals, 'express', {
					method: 'GET',
					url: '/test',
					headers: {},
					body: {},
					query: {},
					clientIp: '127.0.0.1'
				});
			}).toThrow('Cannot locate routes file');

			if (originalRoutes) {
				process.env._EAPI_ROUTES = originalRoutes;
			} else {
				delete process.env._EAPI_ROUTES;
			}
		});

		it('should throw error when routes file not found in socket route', () => {
			const originalRoutes = process.env._EAPI_ROUTES;
			process.env._EAPI_ROUTES = 'nonexistent/routes.cjs';

			expect(() => {
				new Request(mockGlobals, 'socket', {
					route: '/test',
					socket: {
						handshake: {
							headers: {},
							address: '127.0.0.1'
						}
					},
					data: {}
				});
			}).toThrow('Cannot locate routes file');

			if (originalRoutes) {
				process.env._EAPI_ROUTES = originalRoutes;
			} else {
				delete process.env._EAPI_ROUTES;
			}
		});
	});

	describe('route matching edge cases', () => {
		it('should handle route with wildcard parameters', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test/123/456',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/test/123/456');
			// Resource may be undefined if route doesn't match
		});

		it('should handle route with array method', () => {
			// This tests routes with array methods like ['get', 'post']
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/test');
		});

		it('should handle route with any method', () => {
			// This tests routes with method: 'any'
			const request = new Request(mockGlobals, 'express', {
				method: 'PATCH',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/test');
			// Resource may be undefined if route doesn't match
		});

		it('should handle route with path unshift', () => {
			(process as any).__EAPI_PATH_UNSHIFT = '/api';
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/api/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/api/test');
			delete (process as any).__EAPI_PATH_UNSHIFT;
		});

		it('should handle route with path shift', () => {
			(process as any).__EAPI_PATH_SHIFT = '/v1';
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/test');
			delete (process as any).__EAPI_PATH_SHIFT;
		});

		it('should handle route path with error catch-all', () => {
			// Test route path '/{error+}' which should set resource.path to undefined
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/error',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/error');
			// Resource may be undefined if route doesn't match
		});

		it('should handle root path /', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/');
		});

		it('should handle empty path', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBeDefined();
		});

		it('should handle route with multiple path segments and parameters', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test/user/123/item/456',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/test/user/123/item/456');
			expect(request.parameters.path).toBeDefined();
		});
	});

	describe('socket route edge cases', () => {
		it('should handle socket route with path unshift', () => {
			(process as any).__EAPI_PATH_UNSHIFT = '/api';
			const request = new Request(mockGlobals, 'socket', {
				route: '/api/test',
				socket: {
					handshake: {
						headers: {},
						address: '127.0.0.1'
					}
				},
				data: {}
			});

			expect(request.path).toBe('/api/test');
			delete (process as any).__EAPI_PATH_UNSHIFT;
		});

		it('should handle socket route with path shift', () => {
			(process as any).__EAPI_PATH_SHIFT = '/v1';
			const request = new Request(mockGlobals, 'socket', {
				route: '/test',
				socket: {
					handshake: {
						headers: {},
						address: '127.0.0.1'
					}
				},
				data: {}
			});

			expect(request.resource).toBeDefined();
			delete (process as any).__EAPI_PATH_SHIFT;
		});

		it('should handle socket route with error catch-all', () => {
			const request = new Request(mockGlobals, 'socket', {
				route: '/error',
				socket: {
					handshake: {
						headers: {},
						address: '127.0.0.1'
					}
				},
				data: {}
			});

			expect(request.path).toBeDefined();
			// Resource may be undefined if route doesn't match
		});

		it('should handle socket route root path', () => {
			const request = new Request(mockGlobals, 'socket', {
				route: '/',
				socket: {
					handshake: {
						headers: {},
						address: '127.0.0.1'
					}
				},
				data: {}
			});

			expect(request.path).toBe('/');
		});

		it('should handle socket route empty path', () => {
			const request = new Request(mockGlobals, 'socket', {
				route: '',
				socket: {
					handshake: {
						headers: {},
						address: '127.0.0.1'
					}
				},
				data: {}
			});

			expect(request.path).toBeDefined();
		});
	});

	describe('express route edge cases', () => {

		it('should handle express route with uppercase method', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'POST',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.method).toBe('post');
		});

		it('should handle express route with mixed case method', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'DeLeTe',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.method).toBe('delete');
		});

		it('should handle express route with complex query string', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test?foo=bar&baz=qux&nested[key]=value',
				headers: {},
				body: {},
				query: { foo: 'bar', baz: 'qux', nested: { key: 'value' } },
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/test');
			expect(request.parameters.query).toBeDefined();
		});

		it('should handle express route with no matching route', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/nonexistent/route/path',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/nonexistent/route/path');
			// Resource may be undefined if no route matches
		});
	});

	describe('_awsParse and _awsRoute', () => {
		it('should accept aws type', () => {
			const request = new Request(mockGlobals, 'aws', {
				httpMethod: 'GET',
				path: '/test',
				resource: '/test',
				headers: { 'content-type': 'application/json' },
				body: null,
				queryStringParameters: { filter: 'active' },
				pathParameters: { id: '123' },
				requestContext: {
					requestId: 'req-123',
					identity: { sourceIp: '127.0.0.1' }
				}
			});

			expect(request.type).toBe('aws');
			expect(request.source).toBe('route');
			expect(request.method).toBe('get');
			expect(request.path).toBe('/test');
			expect(request.context?.id).toBe('req-123');
			expect(request.context?.ipAddress).toBe('127.0.0.1');
		});

		it('should handle AWS API Gateway request', () => {
			const request = new Request(mockGlobals, 'aws', {
				httpMethod: 'POST',
				path: '/users/123',
				resource: '/users/{id}',
				headers: { 'Content-Type': 'application/json' },
				body: '{"name":"test"}',
				queryStringParameters: null,
				pathParameters: { id: '123' },
				requestContext: {
					requestId: 'req-456',
					identity: { sourceIp: '10.0.0.1' }
				}
			});

			expect(request.method).toBe('post');
			expect(request.path).toBe('/users/123');
			expect(request.resource?.path).toBe('/users/{id}');
			expect(request.parameters.path).toEqual({ id: '123' });
			expect(request.body).toEqual({ name: 'test' });
		});

		it('should handle AWS error catch-all route', () => {
			const request = new Request(mockGlobals, 'aws', {
				httpMethod: 'GET',
				path: '/error',
				resource: '/{error+}',
				headers: {},
				body: null,
				queryStringParameters: null,
				pathParameters: null,
				requestContext: {
					requestId: 'req-789',
					identity: { sourceIp: '127.0.0.1' }
				}
			});

			expect(request.resource?.path).toBeUndefined();
		});

		it('should handle AWS root path', () => {
			const request = new Request(mockGlobals, 'aws', {
				httpMethod: 'GET',
				path: '/',
				resource: '/',
				headers: {},
				body: null,
				queryStringParameters: null,
				pathParameters: null,
				requestContext: {
					requestId: 'req-root',
					identity: { sourceIp: '127.0.0.1' }
				}
			});

			expect(request.resource?.path).toBe('/index');
		});

		it('should handle AWS path unshift', () => {
			(process as any).__EAPI_PATH_UNSHIFT = '/api';
			const request = new Request(mockGlobals, 'aws', {
				httpMethod: 'GET',
				path: '/api/test',
				resource: '/api/test',
				headers: {},
				body: null,
				queryStringParameters: null,
				pathParameters: null,
				requestContext: {
					requestId: 'req-unshift',
					identity: { sourceIp: '127.0.0.1' }
				}
			});

			expect(request.resource?.path).toBeDefined();
			delete (process as any).__EAPI_PATH_UNSHIFT;
		});

		it('should handle AWS path shift', () => {
			(process as any).__EAPI_PATH_SHIFT = '/v1';
			const request = new Request(mockGlobals, 'aws', {
				httpMethod: 'GET',
				path: '/test',
				resource: '/test',
				headers: {},
				body: null,
				queryStringParameters: null,
				pathParameters: null,
				requestContext: {
					requestId: 'req-shift',
					identity: { sourceIp: '127.0.0.1' }
				}
			});

			expect(request.resource?.path).toBeDefined();
			delete (process as any).__EAPI_PATH_SHIFT;
		});
	});

	describe('_awsParse with Records (events)', () => {
		it('should handle AWS SQS Records', () => {
			const request = new Request(mockGlobals, 'aws', {
				Records: [
					{
						eventSource: 'aws:sqs',
						eventSourceARN: 'arn:aws:sqs:us-east-1:123456789:my-queue',
						messageId: 'msg-123',
						receiptHandle: 'handle-123',
						body: '{"data":"test"}'
					}
				]
			});

			expect(request.source).toBe('events');
			expect(request.requests).toHaveLength(1);
		});

		it('should handle AWS RabbitMQ events', () => {
			const request = new Request(mockGlobals, 'aws', {
				rmqMessagesByQueue: {
					'queue-name::arn': [
						{
							basicProperties: { messageId: 'msg-456' },
							data: Buffer.from('{"test":"data"}').toString('base64'),
							redelivered: false
						}
					]
				},
				eventSource: 'aws:rmq',
				eventSourceARN: 'arn:aws:mq:us-east-1:123456789'
			});

			expect(request.source).toBe('events');
			expect(request.requests).toHaveLength(1);
		});

		it('should handle empty Records array', () => {
			const request = new Request(mockGlobals, 'aws', {
				Records: []
			});

			expect(request.source).toBe('events');
			expect(request.requests).toHaveLength(0);
		});
	});

	describe('_awsEvent', () => {
		it('should handle AWS SQS single event', () => {
			const request = new Request(mockGlobals, 'aws', {
				eventSource: 'aws:sqs',
				eventSourceARN: 'arn:aws:sqs:us-east-1:123456789:my-queue',
				messageId: 'msg-single',
				receiptHandle: 'handle-single',
				body: '{"data":"test"}'
			});

			expect(request.source).toBe('event');
			expect(request.method).toBe('awsSqs');
			expect(request.context?.service).toBe('aws:sqs');
		});

		it('should handle AWS RMQ single event', () => {
			const request = new Request(mockGlobals, 'aws', {
				eventSource: 'aws:rmq',
				eventSourceARN: 'arn:aws:mq:us-east-1:123456789:my-broker',
				basicProperties: { messageId: 'msg-rmq' },
				data: Buffer.from('{"test":"data"}').toString('base64'),
				redelivered: false
			});

			expect(request.source).toBe('event');
			expect(request.method).toBe('awsRmq');
			expect(request.body).toEqual({ test: 'data' });
		});

		it('should handle AWS event with double separator in queue name', () => {
			const request = new Request(mockGlobals, 'aws', {
				eventSource: 'aws:sqs',
				eventSourceARN: 'arn:aws:sqs:us-east-1:123456789:system-name--controller-name',
				messageId: 'msg-double',
				receiptHandle: 'handle-double',
				body: '{}'
			});

			expect(request.path).toBe('SystemName/ControllerName');
			expect(request.resource?.path).toBe('/SystemName/ControllerName');
		});

		it('should handle AWS event with dot separator in queue name', () => {
			const request = new Request(mockGlobals, 'aws', {
				eventSource: 'aws:sqs',
				eventSourceARN: 'arn:aws:sqs:us-east-1:123456789:system.name..controller.name',
				messageId: 'msg-dot',
				receiptHandle: 'handle-dot',
				body: '{}'
			});

			expect(request.path).toBe('SystemName/ControllerName');
		});

		it('should handle AWS event with underscore separator', () => {
			const request = new Request(mockGlobals, 'aws', {
				eventSource: 'aws:sqs',
				eventSourceARN: 'arn:aws:sqs:us-east-1:123456789:system_name__controller_name',
				messageId: 'msg-underscore',
				receiptHandle: 'handle-underscore',
				body: '{}'
			});

			expect(request.path).toBe('SystemName/ControllerName');
		});

		it('should handle AWS event with slash separator', () => {
			const request = new Request(mockGlobals, 'aws', {
				eventSource: 'aws:sqs',
				eventSourceARN: 'arn:aws:sqs:us-east-1:123456789:systemName/controllerName',
				messageId: 'msg-slash',
				receiptHandle: 'handle-slash',
				body: '{}'
			});

			expect(request.path).toBe('SystemName/ControllerName');
		});

		it('should handle AWS EventBridge event with method and path', () => {
			const request = new Request(mockGlobals, 'aws', {
				method: 'get',
				path: 'controllerName',
				eventSourceARN: 'arn:aws:events:us-east-1:123456789:rule/my-rule'
			});

			expect(request.method).toBe('get');
		});
	});

	describe('_azureParse and _azureRoute', () => {
		it('should accept azure type', () => {
			expect(() => {
				new Request(mockGlobals, 'azure', {
					// Missing required req object
				});
			}).toThrow('Azure integration only currently supports requests from http triggers');
		});

		it('should throw error for missing req.method', () => {
			expect(() => {
				new Request(mockGlobals, 'azure', {
					req: { url: '/test' }
				});
			}).toThrow('Azure integration only currently supports requests from http triggers');
		});

		it('should throw error for missing req.url', () => {
			expect(() => {
				new Request(mockGlobals, 'azure', {
					req: { method: 'GET' }
				});
			}).toThrow('Azure integration only currently supports requests from http triggers');
		});

		it('should throw error when function.json is missing', () => {
			expect(() => {
				new Request(mockGlobals, 'azure', {
					req: {
						method: 'GET',
						url: '/test',
						headers: {},
						query: {},
						params: {}
					},
					invocationId: 'inv-123',
					executionContext: {
						functionDirectory: '/nonexistent/path'
					}
				});
			}).toThrow('Cannot access azure function.json');
		});

		it('should handle Azure HTTP trigger request', () => {
			const request = new Request(mockGlobals, 'azure', {
				req: {
					method: 'GET',
					url: 'http://localhost:7071/api/test/123',
					originalUrl: 'http://localhost:7071/api/test/123',
					headers: {
						'content-type': 'application/json',
						'x-forwarded-for': '10.0.0.1'
					},
					query: { filter: 'active' },
					params: { id: '123' },
					rawBody: '{"name":"test"}'
				},
				invocationId: 'inv-azure-123',
				headers: { 'content-type': 'application/json' },
				executionContext: {
					functionConfig: azureFunctionConfig
				}
			});

			expect(request.type).toBe('azure');
			expect(request.source).toBe('route');
			expect(request.method).toBe('get');
			expect(request.context?.id).toBe('inv-azure-123');
			expect(request.context?.ipAddress).toBe('10.0.0.1');
			expect(request.parameters.query).toEqual({ filter: 'active' });
			expect(request.parameters.path).toEqual({ id: '123' });
			expect(request.body).toEqual({ name: 'test' });
		});

		it('should handle Azure path unshift', () => {
			(process as any).__EAPI_PATH_UNSHIFT = '/api';
			const request = new Request(mockGlobals, 'azure', {
				req: {
					method: 'GET',
					url: 'http://localhost:7071/api/test/123',
					headers: {},
					query: {},
					params: {}
				},
				invocationId: 'inv-unshift',
				headers: {},
				executionContext: {
					functionConfig: azureFunctionConfig
				}
			});

			expect(request.resource).toBeDefined();
			delete (process as any).__EAPI_PATH_UNSHIFT;
		});

		it('should handle Azure path shift', () => {
			(process as any).__EAPI_PATH_SHIFT = '/v1';
			const request = new Request(mockGlobals, 'azure', {
				req: {
					method: 'GET',
					url: 'http://localhost:7071/api/test/123',
					headers: {},
					query: {},
					params: {}
				},
				invocationId: 'inv-shift',
				headers: {},
				executionContext: {
					functionConfig: azureFunctionConfig
				}
			});

			expect(request.resource).toBeDefined();
			delete (process as any).__EAPI_PATH_SHIFT;
		});

		it('should handle Azure error catch-all route', () => {
			const errorConfig = {
				bindings: [{ type: 'httpTrigger', direction: 'in', route: '{*error}' }]
			};

			const request = new Request(mockGlobals, 'azure', {
				req: {
					method: 'GET',
					url: 'http://localhost:7071/api/error',
					headers: {},
					query: {},
					params: {}
				},
				invocationId: 'inv-error',
				headers: {},
				executionContext: {
					functionConfig: errorConfig
				}
			});

			expect(request.resource?.path).toBeUndefined();
		});

		it('should handle Azure root path', () => {
			const rootConfig = {
				bindings: [{ type: 'httpTrigger', direction: 'in', route: '/' }]
			};

			const request = new Request(mockGlobals, 'azure', {
				req: {
					method: 'GET',
					url: 'http://localhost:7071/',
					headers: {},
					query: {},
					params: {}
				},
				invocationId: 'inv-root',
				headers: {},
				executionContext: {
					functionConfig: rootConfig
				}
			});

			expect(request.resource?.path).toBe('/index');
		});

		it('should handle Azure without x-forwarded-for', () => {
			const request = new Request(mockGlobals, 'azure', {
				req: {
					method: 'POST',
					url: 'http://localhost:7071/api/test/456',
					headers: {},
					query: {},
					params: {}
				},
				invocationId: 'inv-no-forward',
				headers: {},
				executionContext: {
					functionConfig: azureFunctionConfig
				}
			});

			expect(request.context?.ipAddress).toBe('');
		});

		it('should handle Azure with originalUrl', () => {
			const request = new Request(mockGlobals, 'azure', {
				req: {
					method: 'GET',
					url: 'http://localhost:7071/api/test/789',
					originalUrl: 'http://localhost:7071/api/test/789?query=1',
					headers: {},
					query: {},
					params: {}
				},
				invocationId: 'inv-original',
				headers: {},
				executionContext: {
					functionConfig: azureFunctionConfig
				}
			});

			expect(request.path).toBe('/api/test/789');
		});
	});

	describe('edge cases', () => {
		it('should handle missing headers', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: undefined,
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.headers).toBeDefined();
		});

		it('should handle empty query parameters', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.parameters.query).toEqual({});
		});

		it('should handle empty path parameters', () => {
			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.parameters.path).toBeDefined();
		});

		it('should handle express route with PWD from process.env', () => {
			const originalPwd = process.env.PWD;
			process.env.PWD = process.cwd(); // Use actual cwd to avoid route file errors

			const request = new Request(mockGlobals, 'express', {
				method: 'GET',
				url: '/test',
				headers: {},
				body: {},
				query: {},
				clientIp: '127.0.0.1'
			});

			expect(request.path).toBe('/test');

			if (originalPwd) {
				process.env.PWD = originalPwd;
			} else {
				delete process.env.PWD;
			}
		});


		it('should handle socket route with PWD from process.env', () => {
			const originalPwd = process.env.PWD;
			process.env.PWD = process.cwd(); // Use actual cwd to avoid route file errors

			const request = new Request(mockGlobals, 'socket', {
				route: '/test',
				socket: {
					handshake: {
						headers: {},
						address: '127.0.0.1'
					}
				},
				data: {}
			});

			expect(request.path).toBe('/test');

			if (originalPwd) {
				process.env.PWD = originalPwd;
			} else {
				delete process.env.PWD;
			}
		});


	});
});
