import Middleware from '../Base/Middleware';
import { GlobalsType } from '../Types/System';

/**
 * @module express-api/Middleware/Dynamo
 * @class Dynamo
 * @extends Middleware
 * @description Middleware class providing Dynamo DB connection handling on incomming event and outgoing response
 * @author Paul Smith
 * @license MIT
 */
export default class Dynamo<T extends GlobalsType> extends Middleware<T> {

	/**
	 * @public @method start
	 * @description Invoke middleware for incoming request
	 * @param {Object} request The incoming request to API Gateway
	 */
	start(request: any): Promise<any> {
		// start DB connections to all dynamo services
		const services: any[] = [];
		for (const service in this.$services) {
			if ((this.$services as any)[service].name === 'dynamo') {
				services.push((this.$services as any)[service]);
			}
		}

		return Promise.all(services).then(() => request);
	}
}

