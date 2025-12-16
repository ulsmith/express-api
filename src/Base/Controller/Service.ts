import { SwaggerSchemaMethodType } from '../../Types/Swagger';
import Controller from '../Controller';
import RestError from '../../Error/Rest';
import Request from '../../System/Request';
import SchemaTools from '../../Library/SchemaTools';
import { GlobalsType } from '../../Types/System';

enum SchemaMethods {
	post = 'post',
}

export type Schema = {
	[key in SchemaMethods]: SwaggerSchemaMethodType;
};

/**
 * @namespace Service/Base/Controller
 * @class Service;
 * @extends Controller
 * @description Base class to give an extension to system base class for creating models
 * @author Paul Smith (pushfar) <paul.smith@pushfar.com>
 * @copyright 2023 pushfar (pushfar.com) all rights reserved
 * @license Unlicensed
 */
export default abstract class Service<T extends GlobalsType> extends Controller<T> {
	/**
	 * @public @method options
	 * @description Return metadata documentation on the endpoint
	 * @returns {Object} The documentation for this endpoint
	 */
	abstract options(): Schema;

	/**
	 * @public parseBody
	 * @description Parse the body of a request, based on the schemaMethod passed in
	 * @param request The http request passed in to the system
	 * @returns the resulting body data
	 */
	public parseBody<T = any>(request: Request): T {
		try {
			return SchemaTools.parseBody<T>(request, this.options().post, `${this.constructor.name}:post:${this.options().post?.description || ''}`);
		} catch (err: any) {
			throw new RestError(err.message, 400);
		}
	}

	/**
	 * @public parseOutput
	 * @description Parse the response output, based on the schemaMethod passed in to remove data, require it and type check etc
	 * @param data The response data to send out in a response
	 * @returns the resulting body data
	 */
	public parseOutput<T = any>(data: any): T {
		try {
			return SchemaTools.parseOutput<T>(data, this.options().post, `${this.constructor.name}:post:${this.options().post?.description || ''}`);
		} catch (err: any) {
			throw new RestError(err.message, 400);
		}
	}
}
