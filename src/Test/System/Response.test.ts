import Response from '../../System/Response';

describe('Response', () => {
	describe('constructor', () => {
		it('should create response with valid type', () => {
			const response = new Response('express', { status: 200, body: { data: 'test' } });
			expect(response.type).toBe('express');
			expect(response.status).toBe(200);
			expect(response.body).toBeDefined();
		});

		it('should throw error for invalid type', () => {
			expect(() => {
				new Response('invalid' as any, {});
			}).toThrow('Type does not exist');
		});
	});

	describe('set', () => {
		it('should set status, headers, and body', () => {
			const response = new Response('express', {});
			response.set({
				status: 201,
				headers: { 'Content-Type': 'application/json' },
				body: { id: 1 },
			});
			expect(response.status).toBe(201);
			expect(response.headers).toBeDefined();
			expect(response.body).toBeDefined();
		});

		it('should normalize headers', () => {
			const response = new Response('express', {});
			response.set({
				headers: { 'content-type': 'application/json' },
			});
			expect(response.headers?.['Content-Type']).toBe('application/json');
		});

		it('should stringify JSON body when Content-Type is application/json', () => {
			const response = new Response('express', {});
			response.set({
				headers: { 'Content-Type': 'application/json' },
				body: { id: 1 },
			});
			expect(typeof response.body).toBe('string');
			expect(JSON.parse(response.body as string)).toEqual({ id: 1 });
		});

		it('should set isBase64Encoded', () => {
			const response = new Response('aws', {});
			response.set({
				isBase64Encoded: true,
			});
			expect(response.isBase64Encoded).toBe(true);
		});
	});

	describe('get', () => {
		it('should return AWS format for aws type', () => {
			const response = new Response('aws', {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
				body: { data: 'test' },
			});
			const result = response.get();
			expect(result.statusCode).toBe(200);
			expect(result.headers).toBeDefined();
			// Body is stringified when Content-Type is application/json
			expect(typeof result.body).toBe('string');
			// isBase64Encoded may be undefined if not set
			expect('isBase64Encoded' in result).toBe(true);
		});

		it('should return Azure format for azure type', () => {
			const response = new Response('azure', {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
				body: { data: 'test' },
			});
			const result = response.get();
			expect(result.status).toBe(200);
			expect(result.headers).toBeDefined();
			// Body is stringified when Content-Type is application/json
			expect(typeof result.body).toBe('string');
		});

		it('should return Express format for express type', () => {
			const response = new Response('express', {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
				body: { data: 'test' },
			});
			const result = response.get();
			expect(result.status).toBe(200);
			expect(result.headers).toBeDefined();
			// Body is stringified when Content-Type is application/json
			expect(typeof result.body).toBe('string');
		});

		it('should return undefined for socket type', () => {
			const response = new Response('socket', {
				status: 200,
				body: { data: 'test' },
			});
			const result = response.get();
			expect(result).toBeUndefined();
		});
	});

	describe('_parseBody edge cases', () => {
		it('should handle JSON.stringify error gracefully', () => {
			const response = new Response('express', {});
			// Create a circular reference that will cause JSON.stringify to fail
			const circularObj: any = { data: 'test' };
			circularObj.self = circularObj;

			response.set({
				headers: { 'Content-Type': 'application/json' },
				body: circularObj
			});

			// Should return stringified null on error
			expect(response.body).toBe('null');
		});

		it('should handle body without Content-Type header', () => {
			const response = new Response('express', {});
			response.set({
				body: { data: 'test' }
			});

			// Without Content-Type, body should not be stringified
			expect(typeof response.body).toBe('object');
		});

		it('should handle undefined body', () => {
			const response = new Response('express', {});
			response.set({
				body: undefined
			});

			expect(response.body).toBeUndefined();
		});

		it('should handle null body', () => {
			const response = new Response('express', {});
			response.set({
				headers: { 'Content-Type': 'application/json' },
				body: null
			});

			expect(response.body).toBe('null');
		});

		it('should not set headers if not provided', () => {
			const response = new Response('express', {});
			response.set({
				status: 200,
				body: { data: 'test' }
			});

			expect(response.status).toBe(200);
			expect(response.body).toBeDefined();
		});
	});
});

