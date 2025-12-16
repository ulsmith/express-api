import Middleware from '../Base/Middleware.js';
/**
 * @module express-api/Middleware/Dynamo
 * @class Dynamo
 * @extends Middleware
 * @description Middleware class providing Dynamo DB connection handling on incomming event and outgoing response
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Dynamo extends Middleware {
    /**
     * @public @method start
     * @description Invoke middleware for incoming request
     * @param {Object} request The incoming request to API Gateway
     */
    start(request) {
        // start DB connections to all dynamo services
        const services = [];
        for (const service in this.$services) {
            if (this.$services[service].name === 'dynamo') {
                services.push(this.$services[service]);
            }
        }
        return Promise.all(services).then(() => request);
    }
}
//# sourceMappingURL=Dynamo.js.map