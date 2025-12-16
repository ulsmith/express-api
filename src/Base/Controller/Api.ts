import Controller from '../Controller';
import RestError from '../../Error/Rest';
import Request from '../../System/Request';
import SchemaTools from '../../Library/SchemaTools';
import { SwaggerSchemaMethodType } from '../../Types/Swagger';
import { GlobalsType } from '../../Types/System';

enum SchemaMethods {
	get = 'get',
	post = 'post',
	put = 'put',
	patch = 'patch',
	delete = 'delete',
}

export type Schema = {
	[key in SchemaMethods]?: SwaggerSchemaMethodType;
};

/**
 * @module express-api/Base/Controller/Api
 * @class Api
 * @extends Controller
 * @description Base class to give an extension to system base class for creating API controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default abstract class Api<T extends GlobalsType> extends Controller<T> {
	/**
	 * @public @method options
	 * @description Return metadata documentation on the endpoint
	 * @returns The documentation for this endpoint
	 */
	abstract options(): Schema;

	/**
	 * @public parseBody
	 * @description Parse the body of a request, based on the schemaMethod passed in
	 * @param request The http request passed in to the system
	 * @param method The optional method to use if auto detection fails
	 * @returns the resulting body data
	 */
	public parseBody<T = any>(request: Request, method?: 'get' | 'post' | 'put' | 'patch' | 'delete'): T {
		try {
			const m = method || this.getCallingMethod();
			
			return SchemaTools.parseBody<T>(request, this.options()[m as keyof Schema], `${this.constructor.name}:${m}:${this.options()[m as keyof Schema]?.description || ''}`);
		} catch (err: any) {
			throw new RestError(err.message, 400);
		}
	}

	/**
	 * @public parsePathParameters
	 * @description Parse the path parameters of a request, based on the schemaMethod passed in
	 * @param request The http request passed in to the system
	 * @param method The optional method to use if auto detection fails
	 * @returns The resulting parameter data
	 */
	public parsePathParameters<T = any>(request: Request, method?: 'get' | 'post' | 'put' | 'patch' | 'delete'): T {
		try {
			const m = method || this.getCallingMethod();
			
			return SchemaTools.parsePathParameters<T>(request, this.options()[m as keyof Schema], `${this.constructor.name}:${m}:${this.options()[m as keyof Schema]?.description || ''}`);
		} catch (err: any) {
			throw new RestError(err.message, 400);
		}
	}

	/**
	 * @public parseQueryParameters
	 * @description Parse the query parameters of a request, based on the schemaMethod passed in
	 * @param request The http request passed in to the system
	 * @param method The optional method to use if auto detection fails
	 * @returns The resulting parameter data
	 */
	public parseQueryParameters<T = any>(request: Request, method?: 'get' | 'post' | 'put' | 'patch' | 'delete'): T {
		try {
			const m = method || this.getCallingMethod();
			
			return SchemaTools.parseQueryParameters<T>(request, this.options()[m as keyof Schema], `${this.constructor.name}:${m}:${this.options()[m as keyof Schema]?.description || ''}`);
		} catch (err: any) {
			throw new RestError(err.message, 400);
		}
	}

	/**
	 * @public parseOutput
	 * @description Parse the response output, based on the schemaMethod passed in to remove data, require it and type check etc
	 * @param data The response data to send out in a response
	 * @param method The optional method to use if auto detection fails
	 * @returns the resulting body data
	 */
	public parseOutput<T = any>(data: any, method?: 'get' | 'post' | 'put' | 'patch' | 'delete'): T {
		try {
			const m = method || this.getCallingMethod();
			
			return SchemaTools.parseOutput<T>(data, this.options()[m as keyof Schema], `${this.constructor.name}:${m}:${this.options()[m as keyof Schema]?.description || ''}`);
		} catch (err: any) {
			throw new RestError(err.message, 400);
		}
	}

	/**
	 * @protected getCallingMethod
	 * @description Attempts to detect the calling method name from the call stack
	 * @returns The detected method name or undefined if not found
	 */
	protected getCallingMethod(): 'get' | 'post' | 'put' | 'patch' | 'delete' {
		try {
			const stack = new Error().stack;
			if (!stack) throw new Error('not found');

			const stackLines = stack.split('\n');
			for (let i = 2; i < Math.min(stackLines.length, 6); i++) {
				const line = stackLines[i];
				const methods: Array<'get' | 'post' | 'put' | 'patch' | 'delete'> = ['get', 'post', 'put', 'patch', 'delete'];
				for (const method of methods) if (line.includes(`.${method}`) || line.includes(`.${method}(`)) return method;
			}
		} catch {}

		throw new Error('Could not determine HTTP method. Please provide method parameter or ensure parseOutput is called from a method named get, post, put, patch, or delete.');
	}
}
