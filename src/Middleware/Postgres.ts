import Middleware from '../Base/Middleware';
import { GlobalsType } from '../Types/System';

/**
 * @module express-api/Middleware/Postgres
 * @class Postgres
 * @extends Middleware
 * @description Middleware class providing Postgres DB connection handling on incomming event and outgoing response
 * @author Paul Smith
 * @license MIT
 */
export default class Postgres<T extends GlobalsType> extends Middleware<T> {

	/**
	 * @public @method start
	 * @description Invoke middleware for incoming request
	 * @param {Object} request The incoming request to API Gateway
	 */
	start(request: any): Promise<any> {
		// start DB connections to all postgres services
		const services: Promise<any>[] = [];
		for (const service in this.$services) {
			if ((this.$services as any)[service].name === 'postgres') {
				services.push((this.$services as any)[service].connect().catch((error: Error) => {
					console.log('Check ALL connection settings: ' + error.message, JSON.stringify((error as any).stack));
				}));
			}
		}

		return Promise.all(services).then(() => request);
	}

    /**
	 * @public @method end
	 * @description Invoke middleware for outgoing response
     * @param {Object} response The outgoing response to API Gateway
     */
	end(response: any): Promise<any> {
		// stop DB connections to all postgres services
		const services: Promise<any>[] = [];
		for (const service in this.$services) {
			if ((this.$services as any)[service].name === 'postgres') {
				services.push((this.$services as any)[service].end().catch((error: Error) => {
					console.log('Check ALL connection settings: ' + error.message, JSON.stringify((error as any).stack));
				}));
			}
		}

		return Promise.all(services).then(() => response);
	}
}

