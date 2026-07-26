import { z } from 'zod';
import Controller from '../Controller';
import RestError from '../../Error/Rest';
import Request from '../../System/Request';
import { zodToOpenApiSchema, OpenApiSchema } from '../../Library/ZodToOpenApi';
import { GlobalsType } from '../../Types/System';
import type { ZodSchema, ZodMethodSchema } from '../../Types/Zod';

export type { ZodSchema };

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Infer the TypeScript output type from a Zod schema via its _output branded property.
 * When S is a raw type (not a Zod schema) it passes through unchanged, so callers can
 * supply either `typeof MyController.zodSchema.get.params` or a plain `{ id: string }`.
 */
type ZodInfer<S> = S extends z.ZodType ? S['_output'] : S;

/**
 * @module express-api/Base/Controller/ApiZod
 * @class ApiZod
 * @extends Controller
 * @description Base class for API controllers using Zod schemas for validation and OpenAPI generation
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default abstract class ApiZod<T extends GlobalsType> extends Controller<T> {
	/**
	 * @public @static @get zodSchema
	 * @description Zod-based schema definitions for this endpoint. Override in subclass.
	 * @returns The Zod schema definition for this endpoint
	 */
	static get zodSchema(): ZodSchema {
		throw new Error('zodSchema must be overridden in subclass');
	}

	/**
	 * @public @method options
	 * @description Return metadata documentation on the endpoint as OpenAPI fragment (auto-converted from zodSchema)
	 * @returns The documentation for this endpoint
	 */
	options(): OpenApiSchema {
		return zodToOpenApiSchema((this.constructor as typeof ApiZod).zodSchema);
	}

	/**
	 * @public parseBody
	 * @description Parse and validate the request body against the Zod schema defined in zodSchema().
	 * Pass the schema type as a generic for compile-time inference:
	 *   this.parseBody<typeof MyController.zodSchema.post.body>(request)
	 * @param request The http request passed in to the system
	 * @param method The optional method to use if auto detection fails
	 * @returns The validated body data
	 */
	public parseBody<S = any>(request: Request, method?: HttpMethod): ZodInfer<S> {
		const m = method || this.getCallingMethod();
		const methodSchema = this.__getMethodSchema(m);
		if (!methodSchema.body) throw new RestError('Body schema not defined for method ' + m, 400);

		const result = methodSchema.body.safeParse(request.body);
		if (!result.success) {
			throw new RestError(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
		}
		return result.data;
	}

	/**
	 * @public parsePathParameters
	 * @description Parse and validate the path parameters against the Zod schema defined in zodSchema().
	 * Pass the schema type as a generic for compile-time inference:
	 *   this.parsePathParameters<typeof MyController.zodSchema.get.params>(request)
	 * @param request The http request passed in to the system
	 * @param method The optional method to use if auto detection fails
	 * @returns The validated path parameter data
	 */
	public parsePathParameters<S = any>(request: Request, method?: HttpMethod): ZodInfer<S> {
		const m = method || this.getCallingMethod();
		const methodSchema = this.__getMethodSchema(m);
		if (!methodSchema.params) throw new RestError('Path parameters schema not defined for method ' + m, 400);

		const result = methodSchema.params.safeParse(request.parameters.path);
		if (!result.success) {
			throw new RestError(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
		}
		return result.data;
	}

	/**
	 * @public parseQueryParameters
	 * @description Parse and validate the query parameters against the Zod schema defined in zodSchema().
	 * Pass the schema type as a generic for compile-time inference:
	 *   this.parseQueryParameters<typeof MyController.zodSchema.get.query>(request)
	 * @param request The http request passed in to the system
	 * @param method The optional method to use if auto detection fails
	 * @returns The validated query parameter data
	 */
	public parseQueryParameters<S = any>(request: Request, method?: HttpMethod): ZodInfer<S> {
		const m = method || this.getCallingMethod();
		const methodSchema = this.__getMethodSchema(m);
		if (!methodSchema.query) throw new RestError('Query parameters schema not defined for method ' + m, 400);

		const result = methodSchema.query.safeParse(request.parameters.query);
		if (!result.success) {
			throw new RestError(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
		}
		return result.data;
	}

	/**
	 * @public parseOutput
	 * @description Parse and validate response output against the Zod schema defined in zodSchema().
	 * Pass the response schema type as a generic for compile-time inference:
	 *   this.parseOutput<typeof MyController.zodSchema.post.response[200]['schema']>(data)
	 * @param data The response data to send out in a response
	 * @param method The optional method to use if auto detection fails
	 * @param statusCode The HTTP status code to select the response schema (defaults to 200)
	 * @returns The validated output data
	 */
	public parseOutput<S = any>(data: any, method?: HttpMethod, statusCode: number = 200): ZodInfer<S> {
		const m = method || this.getCallingMethod();
		const methodSchema = this.__getMethodSchema(m);
		if (!methodSchema.response) throw new RestError('Response schema not defined for method ' + m, 400);

		const responseSchema = methodSchema.response[statusCode];
		if (!responseSchema) throw new RestError(`Response schema not defined for method ${m} status ${statusCode}`, 400);

		const result = responseSchema.schema.safeParse(data);
		if (!result.success) {
			throw new RestError(result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
		}
		return result.data;
	}

	/**
	 * @private __getMethodSchema
	 * @description Get the ZodMethodSchema for a given HTTP method from zodSchema()
	 * @param method The HTTP method
	 * @returns The method schema
	 */
	private __getMethodSchema(method: string): ZodMethodSchema {
		const schema = (this.constructor as typeof ApiZod).zodSchema[method];
		if (!schema) throw new RestError(`Schema not defined for method ${method}`, 400);
		return schema;
	}

	/**
	 * @protected getCallingMethod
	 * @description Attempts to detect the calling method name from the call stack
	 * @returns The detected method name
	 */
	protected getCallingMethod(): 'get' | 'post' | 'put' | 'patch' | 'delete' {
		try {
			const stack = new Error().stack;
			if (!stack) throw new Error('not found');

			const stackLines = stack.split('\n');
			for (let i = 2; i < Math.min(stackLines.length, 6); i++) {
				const line = stackLines[i];
				// Use word boundary so e.g. getCallingMethod is not mistaken for "get"
				const methods: Array<'get' | 'post' | 'put' | 'patch' | 'delete'> = ['get', 'post', 'put', 'patch', 'delete'];
				for (const method of methods) {
					if (new RegExp(`\\.${method}\\b`).test(line)) return method;
				}
			}
		} catch {}

		throw new Error('Could not determine HTTP method. Please provide method parameter or ensure parseOutput is called from a method named get, post, put, patch, or delete.');
	}
}
