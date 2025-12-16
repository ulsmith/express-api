import { jest } from '@jest/globals';
import SchemaTools from '../../Library/SchemaTools';
import { SwaggerSchemaMethodType } from '../../Types/Swagger';

// Mock Request class for testing
class MockRequest {
	body: any;
	parameters: { path: Record<string, any>; query: Record<string, any> };

	constructor(body: any = {}, pathParams: Record<string, any> = {}, queryParams: Record<string, any> = {}) {
		this.body = body;
		this.parameters = { path: pathParams, query: queryParams };
	}
}

// Helper to create a simple schema block
const createSchemaBlock = (bodySchema: any, required: string[] = []): SwaggerSchemaMethodType => ({
	description: 'Test endpoint',
	responses: {
		200: {
			description: 'Success',
			content: {
				'application/json': {
					schema: bodySchema,
				},
			},
		},
	},
	requestBody: {
		description: 'Request body',
		content: {
			'application/json': {
				schema: {
					type: 'object',
					description: 'Request body object',
					required,
					properties: bodySchema.properties || bodySchema,
				},
			},
		},
	},
});

describe('SchemaTools', () => {
	describe('Basic Type Validation', () => {
		describe('String validation', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						name: { type: 'string', description: 'A name' },
					},
				},
				['name']
			);

			it('should accept valid string', () => {
				const request = new MockRequest({ name: 'John' });
				const result = SchemaTools.parseBody(request as any, schema);
				expect(result).toEqual({ name: 'John' });
			});

			it('should throw on number instead of string', () => {
				const request = new MockRequest({ name: 123 });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'number' is not of type 'string'");
			});

			it('should throw on boolean instead of string', () => {
				const request = new MockRequest({ name: true });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'boolean' is not of type 'string'");
			});

			it('should throw on false instead of string', () => {
				const request = new MockRequest({ name: false });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'boolean' is not of type 'string'");
			});

			it('should throw on array instead of string', () => {
				const request = new MockRequest({ name: ['test'] });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'array' is not of type 'string'");
			});

			it('should throw on object instead of string', () => {
				const request = new MockRequest({ name: { value: 'test' } });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'object' is not of type 'string'");
			});
		});

		describe('Number validation', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						age: { type: 'number', description: 'An age' },
					},
				},
				['age']
			);

			it('should accept valid number', () => {
				const request = new MockRequest({ age: 25 });
				const result = SchemaTools.parseBody(request as any, schema);
				expect(result).toEqual({ age: 25 });
			});

			it('should accept zero', () => {
				const request = new MockRequest({ age: 0 });
				const result = SchemaTools.parseBody(request as any, schema);
				expect(result).toEqual({ age: 0 });
			});

			it('should throw on string instead of number', () => {
				const request = new MockRequest({ age: '25' });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'string' is not of type 'number'");
			});

			it('should throw on boolean instead of number', () => {
				const request = new MockRequest({ age: false });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'boolean' is not of type 'number'");
			});
		});

		describe('Boolean validation', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						active: { type: 'boolean', description: 'Is active' },
					},
				},
				['active']
			);

			it('should accept true', () => {
				const request = new MockRequest({ active: true });
				const result = SchemaTools.parseBody(request as any, schema);
				expect(result).toEqual({ active: true });
			});

			it('should accept false', () => {
				const request = new MockRequest({ active: false });
				const result = SchemaTools.parseBody(request as any, schema);
				expect(result).toEqual({ active: false });
			});

			it('should throw on string instead of boolean', () => {
				const request = new MockRequest({ active: 'true' });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'string' is not of type 'boolean'");
			});

			it('should throw on number instead of boolean', () => {
				const request = new MockRequest({ active: 1 });
				expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'number' is not of type 'boolean'");
			});
		});
	});

	describe('Required Fields', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					name: { type: 'string', description: 'A name' },
					age: { type: 'number', description: 'An age' },
				},
			},
			['name']
		);

		it('should throw when required field is missing', () => {
			const request = new MockRequest({ age: 25 });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('name is required');
		});

		it('should pass when required field is present', () => {
			const request = new MockRequest({ name: 'John' });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ name: 'John', age: undefined });
		});

		it('should throw when required field is undefined', () => {
			const request = new MockRequest({ name: undefined, age: 25 });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('name is required');
		});

		it('should throw when required field is null', () => {
			const request = new MockRequest({ name: null, age: 25 });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('is required');
		});
	});

	describe('Extra Properties', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					name: { type: 'string', description: 'A name' },
				},
			},
			['name']
		);

		it('should silently omit extra properties', () => {
			const request = new MockRequest({ name: 'John', extra: 'data', another: 123 });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ name: 'John' });
			expect(result).not.toHaveProperty('extra');
			expect(result).not.toHaveProperty('another');
		});
	});

	describe('Array Validation', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					items: {
						type: 'array',
						description: 'A list of strings',
						items: { type: 'string', description: 'A string item' },
					},
				},
			},
			['items']
		);

		it('should accept valid array of strings', () => {
			const request = new MockRequest({ items: ['a', 'b', 'c'] });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ items: ['a', 'b', 'c'] });
		});

		it('should throw on object instead of array', () => {
			const request = new MockRequest({ items: { a: 'b' } });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'object' is not of type 'array'");
		});

		it('should throw on string instead of array', () => {
			const request = new MockRequest({ items: 'not an array' });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'string' is not of type 'array'");
		});

		it('should throw when array item has wrong type', () => {
			const request = new MockRequest({ items: ['valid', 123, 'also valid'] });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'number' is not of type 'string'");
		});
	});

	describe('Nested Object Validation', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					user: {
						type: 'object',
						description: 'A user object',
						required: ['name'],
						properties: {
							name: { type: 'string', description: 'User name' },
							profile: {
								type: 'object',
								description: 'User profile',
								properties: {
									bio: { type: 'string', description: 'User bio' },
									age: { type: 'number', description: 'User age' },
								},
							},
						},
					},
				},
			},
			['user']
		);

		it('should accept valid nested object', () => {
			const request = new MockRequest({
				user: {
					name: 'John',
					profile: {
						bio: 'Developer',
						age: 30,
					},
				},
			});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({
				user: {
					name: 'John',
					profile: {
						bio: 'Developer',
						age: 30,
					},
				},
			});
		});

		it('should throw on wrong type in nested object', () => {
			const request = new MockRequest({
				user: {
					name: 'John',
					profile: {
						bio: 123, // should be string
						age: 30,
					},
				},
			});
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'number' is not of type 'string'");
		});

		it('should throw on missing required nested field', () => {
			const request = new MockRequest({
				user: {
					profile: { bio: 'Test' },
				},
			});
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('name is required');
		});

		it('should omit extra properties in nested objects', () => {
			const request = new MockRequest({
				user: {
					name: 'John',
					extraField: 'should be removed',
					profile: {
						bio: 'Developer',
						extraNested: 'also removed',
					},
				},
			});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result.user).not.toHaveProperty('extraField');
			expect(result.user.profile).not.toHaveProperty('extraNested');
		});
	});

	describe('Union Types (type as array)', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					value: {
						type: ['string', 'number'],
						description: 'A value that can be string or number',
					},
				},
			},
			['value']
		);

		it('should accept string for union type', () => {
			const request = new MockRequest({ value: 'hello' });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: 'hello' });
		});

		it('should accept number for union type', () => {
			const request = new MockRequest({ value: 42 });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: 42 });
		});

		it('should throw on boolean for string|number union', () => {
			const request = new MockRequest({ value: true });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow();
		});

		it('should throw on array for string|number union', () => {
			const request = new MockRequest({ value: [1, 2, 3] });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow();
		});
	});

	describe('OneOf Validation', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					data: {
						oneOf: [
							{
								type: 'array',
								description: 'An array of strings',
								items: { type: 'string', description: 'String item' },
							},
							{
								type: 'object',
								description: 'An object with name',
								properties: {
									name: { type: 'string', description: 'The name' },
								},
							},
						],
						description: 'Data that can be array or object',
					},
				},
			},
			['data']
		);

		it('should accept valid array for oneOf', () => {
			const request = new MockRequest({ data: ['a', 'b', 'c'] });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ data: ['a', 'b', 'c'] });
		});

		it('should accept valid object for oneOf', () => {
			const request = new MockRequest({ data: { name: 'Test' } });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ data: { name: 'Test' } });
		});

		it('should throw when array contains wrong types', () => {
			const request = new MockRequest({ data: [1, 2, 3] });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'number' is not of type 'string'");
		});

		it('should throw when object property has wrong type', () => {
			const request = new MockRequest({ data: { name: 123 } });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'number' is not of type 'string'");
		});

		it('should silently omit extra properties in oneOf object', () => {
			const request = new MockRequest({ data: { name: 'Test', extra: 'removed' } });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result.data).toEqual({ name: 'Test' });
			expect(result.data).not.toHaveProperty('extra');
		});

		it('should throw on string when oneOf expects array or object', () => {
			const request = new MockRequest({ data: 'not valid' });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow();
		});
	});

	describe('Deeply Nested OneOf', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					data: {
						oneOf: [
							{
								type: 'array',
								description: 'An array of objects',
								items: {
									type: 'object',
									description: 'Item object',
									properties: {
										user: {
											type: 'object',
											description: 'User object',
											properties: {
												name: { type: 'string', description: 'User name' },
											},
										},
									},
								},
							},
							{
								type: 'object',
								description: 'Direct object',
								properties: {
									name: { type: 'string', description: 'Direct name' },
								},
							},
						],
						description: 'Complex data structure',
					},
				},
			},
			['data']
		);

		it('should validate deeply nested structures', () => {
			const request = new MockRequest({
				data: [{ user: { name: 'John' } }, { user: { name: 'Jane' } }],
			});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({
				data: [{ user: { name: 'John' } }, { user: { name: 'Jane' } }],
			});
		});

		it('should throw on wrong type in deeply nested structure', () => {
			const request = new MockRequest({
				data: [{ user: { name: 123 } }],
			});
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'number' is not of type 'string'");
		});

		it('should throw on array in deeply nested string field', () => {
			const request = new MockRequest({
				data: [{ user: { name: [] } }],
			});
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'array' is not of type 'string'");
		});

		it('should throw on false in deeply nested string field', () => {
			const request = new MockRequest({
				data: [{ user: { name: false } }],
			});
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow("type 'boolean' is not of type 'string'");
		});
	});

	describe('Output Validation (parseOutput)', () => {
		const schema: SwaggerSchemaMethodType = {
			description: 'Test endpoint',
			responses: {
				200: {
					description: 'Success',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								description: 'Response object',
								properties: {
									name: { type: 'string', description: 'A name' },
									age: { type: 'number', description: 'An age' },
								},
							},
						},
					},
				},
			},
		};

		it('should filter output to only schema properties', () => {
			const result = SchemaTools.parseOutput({ name: 'John', age: 25, extra: 'removed' }, schema);
			expect(result).toEqual({ name: 'John', age: 25 });
			expect(result).not.toHaveProperty('extra');
		});

		it('should silently omit wrong types in output (ignore mode)', () => {
			const result = SchemaTools.parseOutput({ name: 123, age: 25 }, schema);
			expect(result.name).toBeUndefined();
			expect(result.age).toBe(25);
		});
	});

	describe('String Pattern Validation', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					code: {
						type: 'string',
						description: 'A code',
						pattern: '^[A-Z]{3}$',
					},
				},
			},
			['code']
		);

		it('should accept string matching pattern', () => {
			const request = new MockRequest({ code: 'ABC' });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ code: 'ABC' });
		});

		it('should throw on string not matching pattern', () => {
			const request = new MockRequest({ code: 'abc' });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('fails regex test');
		});
	});

	describe('Enum Validation', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					status: {
						type: 'string',
						description: 'A status',
						enum: ['active', 'inactive', 'pending'],
					},
				},
			},
			['status']
		);

		it('should accept valid enum value', () => {
			const request = new MockRequest({ status: 'active' });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ status: 'active' });
		});

		it('should throw on invalid enum value', () => {
			const request = new MockRequest({ status: 'unknown' });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('is not an enum string value');
		});
	});

	describe('Path Parameters', () => {
		const schema: SwaggerSchemaMethodType = {
			description: 'Test endpoint',
			parameters: [
				{
					name: 'id',
					in: 'path',
					required: true,
					description: 'Resource ID',
					schema: { type: 'string', description: 'The ID' },
				},
				{
					name: 'version',
					in: 'path',
					required: false,
					description: 'API version',
					schema: { type: 'number', description: 'Version number' },
				},
			],
			responses: {
				200: { description: 'Success' },
			},
		};

		it('should parse valid path parameters', () => {
			const request = new MockRequest({}, { id: 'abc123', version: 2 });
			const result = SchemaTools.parsePathParameters(request as any, schema);
			expect(result).toEqual({ id: 'abc123', version: 2 });
		});

		it('should throw when required path param is missing', () => {
			const request = new MockRequest({}, { version: 2 });
			expect(() => SchemaTools.parsePathParameters(request as any, schema)).toThrow("'string' is required");
		});

		it('should throw when schemaBlock is missing', () => {
			const request = new MockRequest({}, { id: 'abc' });
			expect(() => SchemaTools.parsePathParameters(request as any, undefined)).toThrow('schemaBlock must be a valid');
		});

		it('should throw when parameters schema is missing', () => {
			const request = new MockRequest({}, { id: 'abc' });
			const badSchema: SwaggerSchemaMethodType = {
				description: 'Test',
				responses: { 200: { description: 'Success' } },
			};
			expect(() => SchemaTools.parsePathParameters(request as any, badSchema)).toThrow('Path parameters not allowed');
		});

		it('should throw when path params missing from request', () => {
			const request = { body: {}, parameters: {} } as any;
			expect(() => SchemaTools.parsePathParameters(request, schema)).toThrow('Path parameters missing from request');
		});
	});

	describe('Query Parameters', () => {
		const schema: SwaggerSchemaMethodType = {
			description: 'Test endpoint',
			parameters: [
				{
					name: 'search',
					in: 'query',
					required: true,
					description: 'Search term',
					schema: { type: 'string', description: 'Search string' },
				},
				{
					name: 'limit',
					in: 'query',
					required: false,
					description: 'Limit results',
					schema: { type: 'number', description: 'Result limit' },
				},
			],
			responses: {
				200: { description: 'Success' },
			},
		};

		it('should parse valid query parameters', () => {
			const request = new MockRequest({}, {}, { search: 'test', limit: 10 });
			const result = SchemaTools.parseQueryParameters(request as any, schema);
			expect(result).toEqual({ search: 'test', limit: 10 });
		});

		it('should throw when required query param is missing', () => {
			const request = new MockRequest({}, {}, { limit: 10 });
			expect(() => SchemaTools.parseQueryParameters(request as any, schema)).toThrow("'string' is required");
		});

		it('should throw when schemaBlock is missing', () => {
			const request = new MockRequest({}, {}, { search: 'test' });
			expect(() => SchemaTools.parseQueryParameters(request as any, undefined)).toThrow('schemaBlock must be a valid');
		});

		it('should throw when query params missing from request', () => {
			const request = { body: {}, parameters: { path: {} } } as any;
			expect(() => SchemaTools.parseQueryParameters(request, schema)).toThrow('Path parameters missing from request');
		});
	});

	describe('Union Types Extended', () => {
		it('should accept boolean in union type', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'boolean'], description: 'String or boolean' },
					},
				},
				['value']
			);
			const request = new MockRequest({ value: true });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: true });
		});

		it('should accept false in union type', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'boolean'], description: 'String or boolean' },
					},
				},
				['value']
			);
			const request = new MockRequest({ value: false });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: false });
		});

		it('should accept array in union type', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'array'], description: 'String or array' },
					},
				},
				['value']
			);
			const request = new MockRequest({ value: [1, 2, 3] });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: [1, 2, 3] });
		});

		it('should accept object in union type', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'object'], description: 'String or object' },
					},
				},
				['value']
			);
			const request = new MockRequest({ value: { key: 'val' } });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: { key: 'val' } });
		});

		it('should use default when union value is null', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'number'], description: 'String or number', default: 'default_value' },
					},
				},
				[]
			);
			const request = new MockRequest({ value: null });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: 'default_value' });
		});

		it('should return null/undefined for non-required empty union', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'number'], description: 'String or number' },
					},
				},
				[]
			);
			const request = new MockRequest({});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result.value).toBeUndefined();
		});

		it('should throw when union is required but missing', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'number'], description: 'String or number' },
					},
				},
				['value']
			);
			const request = new MockRequest({});
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('is required');
		});
	});

	describe('OneOf Extended', () => {
		it('should return undefined for non-required empty oneOf', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						data: {
							oneOf: [
								{ type: 'string', description: 'String option' },
								{ type: 'number', description: 'Number option' },
							],
							description: 'Data',
						},
					},
				},
				[]
			);
			const request = new MockRequest({});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result.data).toBeUndefined();
		});

		it('should throw when oneOf is required but missing', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						data: {
							oneOf: [
								{ type: 'string', description: 'String option' },
								{ type: 'number', description: 'Number option' },
							],
							description: 'Data',
						},
					},
				},
				['data']
			);
			const request = new MockRequest({});
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('is required');
		});
	});

	describe('Default Values', () => {
		it('should use string default when value is undefined', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						name: { type: 'string', description: 'A name', default: 'Unknown' },
					},
				},
				[]
			);
			const request = new MockRequest({});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ name: 'Unknown' });
		});

		it('should use number default when value is undefined', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						count: { type: 'number', description: 'A count', default: 0 },
					},
				},
				[]
			);
			const request = new MockRequest({});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ count: 0 });
		});

		it('should use boolean default when value is undefined', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						enabled: { type: 'boolean', description: 'Enabled', default: true },
					},
				},
				[]
			);
			const request = new MockRequest({});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ enabled: true });
		});

		it('should use array default when value is empty', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						items: { type: 'array', description: 'Items', items: { type: 'string', description: 'Item' }, default: ['default'] },
					},
				},
				[]
			);
			const request = new MockRequest({});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ items: ['default'] });
		});

		it('should use object default when value is undefined', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						config: { type: 'object', description: 'Config', properties: {}, default: { key: 'value' } },
					},
				},
				[]
			);
			const request = new MockRequest({});
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ config: { key: 'value' } });
		});
	});

	describe('Output Validation Extended (ignore mode)', () => {
		it('should silently omit union type mismatch in output', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										value: { type: ['string', 'number'], description: 'Value' },
									},
								},
							},
						},
					},
				},
			};
			const result = SchemaTools.parseOutput({ value: { obj: true } }, schema);
			expect(result.value).toBeUndefined();
		});

		it('should silently omit oneOf mismatch in output', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										data: {
											oneOf: [
												{ type: 'string', description: 'String' },
												{ type: 'number', description: 'Number' },
											],
											description: 'Data',
										},
									},
								},
							},
						},
					},
				},
			};
			const result = SchemaTools.parseOutput({ data: { obj: true } }, schema);
			expect(result.data).toBeUndefined();
		});

		it('should silently omit wrong boolean in output', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										active: { type: 'boolean', description: 'Active' },
									},
								},
							},
						},
					},
				},
			};
			const result = SchemaTools.parseOutput({ active: 'yes' }, schema);
			expect(result.active).toBeUndefined();
		});

		it('should silently omit wrong array in output', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										items: { type: 'array', description: 'Items', items: { type: 'string', description: 'Item' } },
									},
								},
							},
						},
					},
				},
			};
			const result = SchemaTools.parseOutput({ items: 'not an array' }, schema);
			expect(result.items).toBeUndefined();
		});

		it('should silently omit wrong object in output', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										config: { type: 'object', description: 'Config', properties: {} },
									},
								},
							},
						},
					},
				},
			};
			const result = SchemaTools.parseOutput({ config: 'not an object' }, schema);
			expect(result.config).toBeUndefined();
		});

		it('should silently set wrong item types to undefined in output', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										items: { type: 'array', description: 'Items', items: { type: 'string', description: 'Item' } },
									},
								},
							},
						},
					},
				},
			};
			const result = SchemaTools.parseOutput({ items: [1, 2, 3] }, schema);
			// Each invalid item is set to undefined
			expect(result.items).toEqual([undefined, undefined, undefined]);
		});

		it('should silently set wrong nested properties to undefined in output', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										user: {
											type: 'object',
											description: 'User',
											properties: {
												name: { type: 'string', description: 'Name' },
											},
										},
									},
								},
							},
						},
					},
				},
			};
			const result = SchemaTools.parseOutput({ user: { name: 123 } }, schema);
			// The nested property is set to undefined, but the user object is returned
			expect(result.user).toEqual({ name: undefined });
		});
	});

	describe('Number Enum Validation', () => {
		const schema = createSchemaBlock(
			{
				type: 'object',
				description: 'Test object',
				properties: {
					priority: { type: 'number', description: 'Priority', enum: [1, 2, 3] },
				},
			},
			['priority']
		);

		it('should accept valid number enum value', () => {
			const request = new MockRequest({ priority: 2 });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ priority: 2 });
		});

		it('should throw on invalid number enum value', () => {
			const request = new MockRequest({ priority: 5 });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('is not an enum number value');
		});
	});

	describe('Schema without type', () => {
		it('should pass through data when no type is specified', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						data: { description: 'Any data' },
					},
				},
				[]
			);
			const request = new MockRequest({ data: { anything: 'goes' } });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ data: { anything: 'goes' } });
		});
	});

	describe('Additional Properties', () => {
		it('should preserve extra properties when additionalProperties is true', () => {
			// Create schema manually to set additionalProperties on the correct level
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: { 200: { description: 'Success' } },
				requestBody: {
					description: 'Request body',
					content: {
						'application/json': {
							schema: {
								type: 'object',
								description: 'Request body object',
								additionalProperties: true,
								required: ['name'],
								properties: {
									name: { type: 'string', description: 'Name' },
								},
							},
						},
					},
				},
			};
			const request = new MockRequest({ name: 'John', extra: 'kept', another: 123 });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ name: 'John', extra: 'kept', another: 123 });
		});
	});

	describe('Output Validation Warning Paths', () => {
		it('should warn and return undefined for wrong number in output', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test endpoint',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										count: { type: 'number', description: 'Count' },
									},
								},
							},
						},
					},
				},
			};
			const result = SchemaTools.parseOutput({ count: 'not a number' }, schema);
			expect(result.count).toBeUndefined();
		});

		it('should handle unknown type in union gracefully', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'unknown_type' as any], description: 'Value with unknown type' },
					},
				},
				[]
			);
			const request = new MockRequest({ value: 'test' });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: 'test' });
		});

		it('should handle union type mismatch and collect errors', () => {
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test object',
					properties: {
						value: { type: ['string', 'number'], description: 'String or number' },
					},
				},
				['value']
			);
			const request = new MockRequest({ value: { obj: true } });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('does not match any of the union types');
		});
	});

	describe('Edge Cases', () => {
		it('should throw when schemaBlock is missing for parseBody', () => {
			const request = new MockRequest({ data: 'test' });
			expect(() => SchemaTools.parseBody(request as any, undefined)).toThrow('schemaBlock must be a valid');
		});

		it('should throw when body is provided but not allowed in schema', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test',
				responses: { 200: { description: 'Success' } },
			};
			const request = new MockRequest({ unexpected: 'body' });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('Body parameters not allowed');
		});

		it('should throw when body is required but missing', () => {
			const schema = createSchemaBlock({ type: 'object', description: 'Test', properties: {} }, []);
			// Bypass default parameter to test missing body
			const request = { body: undefined, parameters: { path: {}, query: {} } } as any;
			expect(() => SchemaTools.parseBody(request, schema)).toThrow('Body parameters missing');
		});

		it('should throw when schemaBlock is missing for parseOutput', () => {
			expect(() => SchemaTools.parseOutput({ data: 'test' }, undefined)).toThrow('schemaBlock must be a valid');
		});

		it('should throw when 200 response schema is missing', () => {
			const schema: SwaggerSchemaMethodType = {
				description: 'Test',
				responses: { 200: { description: 'Success' } },
			};
			expect(() => SchemaTools.parseOutput({ data: 'test' }, schema)).toThrow('Cannot find a 200 response');
		});
	});

	describe('Edge cases for ignore mode and union types', () => {
		it('should skip unknown types in union and continue to find match', () => {
			// Test that unknown types in union are skipped (line 183 continue)
			// First type is unknown, should skip it, then match the second type
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test',
					properties: {
						value: { type: ['unknownType' as any, 'string'], description: 'Unknown then string' },
					},
				},
				[]
			);

			const request = new MockRequest({ value: 'valid string' });
			const result = SchemaTools.parseBody(request as any, schema);
			expect(result).toEqual({ value: 'valid string' });
		});

		it('should collect errors when all union types fail', () => {
			// When all union types fail, errors should be collected (line 211, 213)
			const schema = createSchemaBlock(
				{
					type: 'object',
					description: 'Test',
					properties: {
						value: { type: ['string', 'number'], description: 'String or number' },
					},
				},
				['value']
			);

			// Pass a boolean which matches neither string nor number
			const request = new MockRequest({ value: true });
			expect(() => SchemaTools.parseBody(request as any, schema)).toThrow('does not match any of the union types');
		});

		it('should handle array item validation failure with ignore=true (parseOutput)', () => {
			// parseOutput uses ignore=true - lines 420-421
			const schema: SwaggerSchemaMethodType = {
				description: 'Test',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'array',
									description: 'List of strings',
									items: {
										type: 'string',
										description: 'A string item',
									},
								},
							},
						},
					},
				},
			};

			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
			// Pass array with wrong type - number instead of string triggers error in __checkString
			const result = SchemaTools.parseOutput([123], schema);
			// With ignore=true, this warns and returns undefined for that item
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		it('should handle nested object validation failure with ignore=true (parseOutput)', () => {
			// parseOutput uses ignore=true for output validation - lines 481-482
			const schema: SwaggerSchemaMethodType = {
				description: 'Test',
				responses: {
					200: {
						description: 'Success',
						content: {
							'application/json': {
								schema: {
									type: 'object',
									description: 'Response',
									properties: {
										data: {
											type: 'object',
											description: 'Data object',
											properties: {
												name: { type: 'string', description: 'Name' },
											},
										},
									},
								},
							},
						},
					},
				},
			};

			const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
			// Pass nested object with wrong type for property
			const result = SchemaTools.parseOutput({ data: { name: 12345 } }, schema);
			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});

