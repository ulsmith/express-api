import { SwaggerSchemaMethodType, SwaggerSchemaStringParameterType, SwaggerSchemaNumberParameterType, SwaggerSchemaBooleanParameterType, SwaggerSchemaArrayParameterType, SwaggerSchemaObjectParameterType, SwaggerSchemaUnionParameterType, SwaggerSchemaOneOfParameterType, SwaggerSchemaParametersType } from '../Types/Swagger';
import Request from '../System/Request';

/**
 * @namespace API/Library
 * @class SchemaTools
 * @extends Controller
 * @description Base class to give an extension to system base class for creating models
 * @author Paul Smith (pushfar) <paul.smith@pushfar.com>
 * @copyright 2023 pushfar (pushfar.com) all rights reserved
 * @license Unlicensed
 */
export default class SchemaTools {
	/**
	 * @public @static parseBody
	 * @description Parse the body of a request, based on the schemaMethod passed in
	 * @param request The http request passed in to the system
	 * @param schemaBlock The specific schema block from the controller schema to parse against
	 * @returns the resulting body data
	 */
	public static parseBody<T = any>(request: Request, schemaBlock?: SwaggerSchemaMethodType, debugMessage?: string): T {
		if (!schemaBlock) throw new Error('schemaBlock must be a valid schemaMethod or SwaggerSchemaObjectParameter, check your schema is correct');
		const schemaBody = schemaBlock.requestBody?.content?.['application/json']?.schema;

		const requestBody = request.body;

		if (!schemaBody && requestBody) throw new Error('Body parameters not allowed in request');
		if (schemaBody && !requestBody) throw new Error('Body parameters missing from request');
		if (typeof schemaBody === 'string') throw new Error('Schema block is detected as a string, meaning its being pointed to a swagger schema object loaded in the controller index, switch to passing in the SwaggerSchemaObjectParameter directly that is being loaded into the swagger index.');
		if (!schemaBody) return requestBody;

		return SchemaTools.__check(schemaBody as SwaggerSchemaParametersType, requestBody, false, 'body', undefined, undefined, debugMessage);
	}

	/**
	 * @public @static parsePathParameters
	 * @description Parse the path parameters of a request, based on the schemaMethod passed in
	 * @param request The http request passed in to the system
	 * @param schemaBlock The specific schema block from the controller schema to parse against
	 * @returns The resulting parameter data
	 */
	public static parsePathParameters<T = any>(request: Request, schemaBlock?: SwaggerSchemaMethodType, debugMessage?: string): T {
		if (!schemaBlock) throw new Error('schemaBlock must be a valid SwaggerSchemaMethod or method block');
		const schemaParams = schemaBlock.parameters;

		if (!schemaParams) throw new Error('Path parameters not allowed in request');
		if (schemaParams && !request.parameters.path) throw new Error('Path parameters missing from request');

		return schemaParams
			.filter((param) => param.in === 'path')
			.reduce((pre, cur) => {
				const value = request.parameters.path[cur.name as keyof typeof request.parameters.path];

				return { ...pre, [cur.name]: SchemaTools.__check(cur.schema as SwaggerSchemaParametersType, value, false, cur.name, cur.required, undefined, debugMessage) };
			}, {}) as T;
	}

	/**
	 * @public @static parseQueryParameters
	 * @description Parse the query parameters of a request, based on the schemaMethod passed in
	 * @param request The http request passed in to the system
	 * @param schemaBlock The specific schema block from the controller schema to parse against
	 * @returns The resulting parameter data
	 */
	public static parseQueryParameters<T = any>(request: Request, schemaBlock?: SwaggerSchemaMethodType, debugMessage?: string): T {
		if (!schemaBlock) throw new Error('schemaBlock must be a valid SwaggerSchemaMethod or method block');
		const schemaParams = schemaBlock.parameters;

		if (!schemaParams) throw new Error('Path parameters not allowed in request');
		if (schemaParams && !request.parameters.query) throw new Error('Path parameters missing from request');

		return schemaParams
			.filter((param) => param.in === 'query')
			.reduce((pre, cur) => {
				const value = request.parameters.query[cur.name as keyof typeof request.parameters.query];

				return { ...pre, [cur.name]: SchemaTools.__check(cur.schema as SwaggerSchemaParametersType, value, false, cur.name, cur.required, undefined, debugMessage) };
			}, {}) as T;
	}

	/**
	 * @public @static parseOutput
	 * @description Parse the response output, based on the schemaMethod passed in to remove data, require it and type check etc
	 * @param data The response data to send out in a response
	 * @param schemaBlock The specific schema block from the controller schema to parse against
	 * @returns the resulting body data
	 */
	public static parseOutput<T = any>(data: any, schemaBlock?: SwaggerSchemaMethodType, debugMessage?: string): T {
		if (!schemaBlock) throw new Error('schemaBlock must be a valid schemaMethod or SwaggerSchemaObjectParameter, check your schema is correct');
		const schemaResponse = schemaBlock.responses[200].content?.['application/json']?.schema;

		if (!schemaResponse) throw new Error('Cannot find a 200 response application/json schema');
		if ('$ref' in schemaResponse) throw new Error('Schema 200 response block is detected as a string, meaning its being pointed to a swagger schema object, this is not supported');

		return SchemaTools.__check(schemaResponse as SwaggerSchemaParametersType, data, true, 'body', undefined, undefined, debugMessage);
	}

	/**
	 * @private static __check
	 * @description Check parameter type against schema
	 * @param schemaParam The schema param to check data against
	 * @param data The data to check
	 * @param key The key of the data we are checking
	 * @param required Is the data required or optional
	 * @returns The schema param data
	 */
	private static __check(schemaParam: SwaggerSchemaParametersType, data: any, ignore: boolean, key = 'body', required?: boolean, parentSchema?: SwaggerSchemaParametersType, debugMessage?: string): any {
		// Handle oneOf - try each schema until one matches
		if ('oneOf' in schemaParam && Array.isArray(schemaParam.oneOf)) {
			return SchemaTools.__checkOneOf(schemaParam as SwaggerSchemaOneOfParameterType, data, ignore, key, required, parentSchema, debugMessage);
		}

		// Handle union types (type as array)
		if ('type' in schemaParam && Array.isArray(schemaParam.type)) {
			return SchemaTools.__checkUnion(schemaParam as SwaggerSchemaUnionParameterType, data, ignore, key, required, parentSchema, debugMessage);
		}

		// Handle single type
		if ('type' in schemaParam && typeof schemaParam.type === 'string') {
			switch (schemaParam.type) {
				case 'string':
					return SchemaTools.__checkString(schemaParam as SwaggerSchemaStringParameterType, data, ignore, key, required, debugMessage);
				case 'number':
					return SchemaTools.__checkNumber(schemaParam as SwaggerSchemaNumberParameterType, data, ignore, key, required, debugMessage);
				case 'boolean':
					return SchemaTools.__checkBoolean(schemaParam as SwaggerSchemaBooleanParameterType, data, ignore, key, required, debugMessage);
				case 'array':
					return SchemaTools.__checkArray(schemaParam as SwaggerSchemaArrayParameterType, data, ignore, key, required, debugMessage);
				case 'object':
					return SchemaTools.__checkObject(schemaParam as SwaggerSchemaObjectParameterType, data, ignore, key, required, parentSchema, debugMessage);
			}
		}

		// no type specified
		return data;
	}

	/**
	 * @private @static __checkUnion
	 * @description Check union type parameter (type as array)
	 * @param schemaParam The schema union param to check data against
	 * @param data The data to check
	 * @param ignore Whether to ignore errors and return undefined
	 * @param key The key of the data we are checking
	 * @param required Is the data required or optional
	 * @param parentSchema The parent schema for context
	 * @returns The validated data
	 */
	private static __checkUnion(schemaParam: SwaggerSchemaUnionParameterType, data: any, ignore: boolean, key: string, required?: boolean, parentSchema?: SwaggerSchemaParametersType, debugMessage?: string): any {
		// basic check - if default and not set, return default
		if (schemaParam.default !== undefined && (data === null || data === undefined)) return schemaParam.default;

		try {
			// basic check - if required and not set, error
			if (required && (data === null || data === undefined)) throw new Error(`${key} union type is required.`);

			// so not required, if empty no more checks needed
			if (data === null || data === undefined) return data;

			// Try each type in the union until one matches
			const errors: string[] = [];
			for (const type of schemaParam.type) {
				try {
					// Quick type check first
					let typeMatches = false;
					switch (type) {
						case 'string':
							typeMatches = typeof data === 'string';
							break;
						case 'number':
							typeMatches = typeof data === 'number';
							break;
						case 'boolean':
							typeMatches = typeof data === 'boolean';
							break;
						case 'array':
							typeMatches = Array.isArray(data);
							break;
						case 'object':
							typeMatches = typeof data === 'object' && data !== null && !Array.isArray(data);
							break;
						default:
							continue; // Skip unknown types
					}

					// If type matches, validate accordingly
					if (typeMatches) {
						// For primitives, do full validation
						if (type === 'string' || type === 'number' || type === 'boolean') {
							let tempSchema: SwaggerSchemaParametersType;
							switch (type) {
								case 'string':
									tempSchema = { description: schemaParam.description, type: 'string' } as SwaggerSchemaStringParameterType;
									break;
								case 'number':
									tempSchema = { description: schemaParam.description, type: 'number' } as SwaggerSchemaNumberParameterType;
									break;
								case 'boolean':
									tempSchema = { description: schemaParam.description, type: 'boolean' } as SwaggerSchemaBooleanParameterType;
									break;
							}
							// Try to validate against this type
							const result = SchemaTools.__check(tempSchema, data, false, key, required, parentSchema, debugMessage);
							// If we got here without error, this type matches
							return result;
						} else {
							// For arrays and objects in unions, just return the data (deep validation should use oneOf)
							return data;
						}
					}
					errors.push(`${type}: type mismatch`);
				} catch (err: any) {
					errors.push(`${type}: ${err.message}`);
					// Continue to next type
				}
			}

			// None of the types matched
			throw new Error(`${key} value does not match any of the union types [${schemaParam.type.join(', ')}]. Errors: ${errors.join('; ')}`);
		} catch (err: any) {
			if (!ignore) throw new Error(err.message);
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] data omitted: ` + err.message);
			return undefined;
		}
	}

	/**
	 * @private @static __checkOneOf
	 * @description Check oneOf parameter (multiple possible schemas)
	 * @param schemaParam The schema oneOf param to check data against
	 * @param data The data to check
	 * @param ignore Whether to ignore errors and return undefined
	 * @param key The key of the data we are checking
	 * @param required Is the data required or optional
	 * @param parentSchema The parent schema for context
	 * @returns The validated data
	 */
	private static __checkOneOf(schemaParam: SwaggerSchemaOneOfParameterType, data: any, ignore: boolean, key: string, required?: boolean, parentSchema?: SwaggerSchemaParametersType, debugMessage?: string): any {
		try {
			// basic check - if required and not set, error
			if (required && (data === null || data === undefined)) throw new Error(`${key} oneOf type is required.`);

			// so not required, if empty no more checks needed
			if (data === null || data === undefined) return data;

			// Determine the actual type of the data
			const dataType = Array.isArray(data) ? 'array' : typeof data;

			// Try each schema in oneOf until one matches
			const errors: { schemaType: string; error: string }[] = [];
			for (let i = 0; i < schemaParam.oneOf.length; i++) {
				try {
					// Try to validate against this schema
					const result = SchemaTools.__check(schemaParam.oneOf[i], data, false, key, required, parentSchema, debugMessage);
					// If we got here without error, this schema matches
					return result;
				} catch (err: any) {
					// Get the schema type for this oneOf option
					const schema = schemaParam.oneOf[i];
					const schemaType = 'type' in schema ? (Array.isArray(schema.type) ? schema.type.join('|') : schema.type) : 'unknown';
					errors.push({ schemaType: schemaType || 'unknown', error: err.message });
				}
			}

			// Find the most relevant error - prefer errors from schemas that match the data's type
			const matchingTypeError = errors.find(e => e.schemaType === dataType);
			const relevantError = matchingTypeError || errors[0];

			// Output clean error message - just the relevant validation failure
			throw new Error(relevantError.error);
		} catch (err: any) {
			if (!ignore) throw new Error(err.message);
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] data omitted: ` + err.message);
			return undefined;
		}
	}

	/**
	 * @private @static __checkString
	 * @description Check string parameter type
	 * @param schemaParam The schema string param to check data against
	 * @param data The data to check
	 * @param key The key of the data we are checking
	 * @param required Is the data required or optional
	 * @returns The schema string param data
	 */
	private static __checkString(schemaParam: SwaggerSchemaStringParameterType, data: any, ignore: boolean, key: string, required?: boolean, debugMessage?: string): string | undefined {
		// basic check - if default and not set, return default
		if (schemaParam.default && (data === null || data === undefined || data === '')) return schemaParam.default;

		try {
			// basic check - if required and not set, error
			if (required && (data === null || data === undefined || data === '')) throw new Error(`${key} type 'string' is required.`);
	
			// so not required, if empty no more checks needed
			if (data === null || data === undefined) return data;
	
			// check type
			if (typeof data !== 'string') throw new Error(`${key} type '${SchemaTools.__getTypeName(data)}' is not of type 'string'.`);
	
			// check against regex
			if (schemaParam.pattern && !(new RegExp(schemaParam.pattern, 's')).test(data)) throw new Error(`${key} type '${schemaParam.type}' value '${data}' fails regex test '${schemaParam.pattern}'.`);
	
			// is it an enum?
			if (schemaParam.enum && !schemaParam.enum.includes(data)) throw new Error(`${key} value '${data}' is not an enum string value of ${schemaParam.enum.join(', ')}`);
		} catch (err: any) {
			if (!ignore) throw new Error(err.message);
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] data omitted: ` + err.message);
			return undefined;
		}

		return data;
	}

	/**
	 * @private @static __checkNumber
	 * @description Check number parameter type
	 * @param schemaParam The schema number param to check data against
	 * @param data The data to check
	 * @param key The key of the data we are checking
	 * @param required Is the data required or optional
	 * @returns The schema number param data
	 */
	private static __checkNumber(schemaParam: SwaggerSchemaNumberParameterType, data: any, ignore: boolean, key: string, required?: boolean, debugMessage?: string): number | undefined {
		// basic check - if default and not set, return default
		if (schemaParam.default !== undefined && (data === null || data === undefined)) return schemaParam.default;

		try {
			// basic check - if required and not set, error
			if (required && (data === null || data === undefined)) throw new Error(`${key} 'number' is required.`);
	
			// so not required, if empty no more checks needed
			if (data === null || data === undefined) return data;
	
			// check type
			if (typeof data !== 'number' || isNaN(data)) throw new Error(`${key} type '${SchemaTools.__getTypeName(data)}' is not of type 'number'.`);
	
			// is it an enum?
			if (schemaParam.enum && !schemaParam.enum.includes(data)) throw new Error(`${key} value '${data}' is not an enum number value of ${schemaParam.enum.join(', ')}`);
		} catch (err: any) {
			if (!ignore) throw new Error(err.message);
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] data omitted: ` + err.message);
			return undefined;
		}

		return data;
	}

	/**
	 * @private @static __checkBoolean
	 * @description Check boolean parameter type
	 * @param schemaParam The schema boolean param to check data against
	 * @param data The data to check
	 * @param key The key of the data we are checking
	 * @param required Is the data required or optional
	 * @returns The boolean string param data
	 */
	private static __checkBoolean(schemaParam: SwaggerSchemaBooleanParameterType, data: any, ignore: boolean, key: string, required?: boolean, debugMessage?: string): boolean | undefined {
		// basic check - if default and not set, return default
		if (schemaParam.default && (data === null || data === undefined)) return schemaParam.default;

		try {
			// basic check - if required and not set, error
			if (required && (data === null || data === undefined)) throw new Error(`${key} 'boolean' is required.`);
	
			// so not required, if empty no more checks needed
			if (data === null || data === undefined) return data;
	
			// check type
			if (typeof data !== 'boolean') throw new Error(`${key} type '${SchemaTools.__getTypeName(data)}' is not of type 'boolean'.`);
		} catch (err: any) {
			if (!ignore) throw new Error(err.message);
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] data omitted: ` + err.message);
			return undefined;
		}

		return data;
	}

	/**
	 * @private @static __checkArray
	 * @description Check array parameter type
	 * @param schemaParam The schema array param to check data against
	 * @param data The data to check
	 * @param key The key of the data we are checking
	 * @param required Is the data required or optional
	 * @returns The schema array param data
	 */
	private static __checkArray(schemaParam: SwaggerSchemaArrayParameterType, data: any, ignore: boolean, key: string, required?: boolean, debugMessage?: string): any[] | undefined {
		try {
			// check type FIRST - must be an array before any other checks
			if (data !== null && data !== undefined && !Array.isArray(data)) {
				throw new Error(`${key} type '${typeof data}' is not of type 'array'.`);
			}

			// basic check - if default and not set, return default
			if (schemaParam.default && (!data || !data.length)) return schemaParam.default;

			// basic check - if required and not set, error
			if (required && (!data || !data.length)) throw new Error(`${key} 'array' is required.`);
	
			// so not required, if empty no more checks needed
			if (!data || !data.length) return data;
		} catch (err: any) {
			if (!ignore) throw new Error(err.message);
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] data omitted: ` + err.message);
			return undefined;
		}

		// check items - wrap in try-catch to ensure validation errors propagate correctly
		try {
			for (let i = 0; i < data.length; i++) {
				const validatedItem = SchemaTools.__check(schemaParam.items as SwaggerSchemaParametersType, data[i], ignore, `${key}[${i}]`, undefined, schemaParam, debugMessage);
				data[i] = validatedItem;
			}
		} catch (err: any) {
			// Re-throw validation errors when ignore is false (input validation)
			if (!ignore) throw err;
			// If ignore is true (output validation), log warning and return undefined
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] array item validation failed: ` + err.message);
			return undefined;
		}

		return data;
	}

	/**
	 * @private @static __checkObject
	 * @description Check object parameter type
	 * @param schemaParam The schema object param to check data against
	 * @param data The data to check
	 * @param key The key of the data we are checking
	 * @param required Is the data required or optional
	 * @returns The object string param data
	 */
	private static __checkObject(schemaParam: SwaggerSchemaObjectParameterType, data: any, ignore: boolean, key: string, required?: boolean, parentSchema?: SwaggerSchemaParametersType, debugMessage?: string): object | undefined {
		// basic check - if default and not set, return default
		if (schemaParam.default && !data) return schemaParam.default;

		try {
			// basic check - if required and not set, error
			if (required && !data) throw new Error(`${key} 'object' is required.`);
	
			// so not required, if empty no more checks needed
			if (!data) return data;
	
			// check type - arrays are objects in JavaScript, so we need to explicitly exclude them
			if (typeof data !== 'object' || data === null || Array.isArray(data)) throw new Error(`${key} type '${Array.isArray(data) ? 'array' : typeof data}' is not of type 'object'.`);
		} catch (err: any) {
			if (!ignore) throw new Error(err.message);
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] data omitted: ` + err.message);
			return undefined;
		}

		// check required properties first - if ignore is false, we need strict validation
		if (!ignore && schemaParam.required) {
			for (const requiredProp of schemaParam.required) {
				if (!(requiredProp in data) || data[requiredProp] === undefined) {
					throw new Error(`${key}.${requiredProp} is required but missing from the object.`);
				}
			}
		}

		// Extra properties are silently dropped (not included in newData)
		// Only schema-defined properties are validated and returned

		// check props - wrap in try-catch to ensure validation errors propagate correctly
		const newData : any = {};
		try {
			for (const k in schemaParam.properties) {
				// look ahead, if prop has an array, and that has a repeat, send in the parent, to aid with recursive checking
				if (((schemaParam.properties[k] as SwaggerSchemaArrayParameterType).items as any)?.description=== '$repeat.parent') schemaParam.properties[k] = { ...parentSchema } as SwaggerSchemaParametersType;

				// check data against schema - if ignore is false, this will throw on validation errors (wrong type, etc.)
				newData[k] = SchemaTools.__check(schemaParam.properties[k] as SwaggerSchemaParametersType, data[k], ignore, `${key}.${k}`, schemaParam.required?.includes(k), schemaParam, debugMessage);
			}
		} catch (err: any) {
			// Re-throw validation errors when ignore is false (input validation)
			if (!ignore) throw err;
			// If ignore is true (output validation), log warning and return undefined
			console.warn(`Schema parse warning [${debugMessage || 'Unknown'}] object validation failed: ` + err.message);
			return undefined;
		}

		// if we allow additional properties, then merge new data on to old to preserve the others not in schema, otherwise return just schema props
		return schemaParam.additionalProperties ? { ...data, ...newData } : newData;
	}

	/**
	 * @private @static __getTypeName
	 * @description Get the actual type name of a value, properly identifying arrays
	 * @param data The data to get the type of
	 * @returns The type name (e.g., 'string', 'number', 'array', 'object', 'boolean', 'null')
	 */
	private static __getTypeName(data: any): string {
		if (data === null) return 'null';
		if (Array.isArray(data)) return 'array';
		return typeof data;
	}
}
