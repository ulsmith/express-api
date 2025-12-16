import Middleware from '../Base/Middleware';
import { GlobalsType } from '../Types/System';

/**
 * @module express-api/Middleware/Cors
 * @class Cors
 * @extends Middleware
 * @description Middleware class providing cors patching to outgoing response
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Cors<T extends GlobalsType> extends Middleware<T> {

    /**
	 * @public @method out
	 * @description Invoke middleware for outgoing response
     * @param {Object} response The outgoing response to API Gateway
     */
	out(response: any): any {
		// update headers on way back out, for all requests that are not options (handled by API gateway directly)
		response.headers['Access-Control-Allow-Origin'] = (this.$client as any).origin;
		response.headers['Access-Control-Allow-Credentials'] = 'true';
		response.headers['Access-Control-Allow-Headers'] = 'Accept, Cache-Control, Content-Type, Content-Length, Authorization, Pragma, Expires, Api-Key, Accept-Encoding';
		response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
		response.headers['Access-Control-Expose-Headers'] = 'Cache-Control, Content-Type, Authorization, Pragma, Expires';

		return response;
	}
}

