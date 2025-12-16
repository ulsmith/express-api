import Middleware from '../Base/Middleware.js';
/**
 * @module express-api/Middleware/Mysql
 * @class Mysql
 * @extends Middleware
 * @description Middleware class providing Mysql DB connection handling on incomming event and outgoing response
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Mysql extends Middleware {
    /**
     * @public @method start
     * @description Invoke middleware for incoming request
     * @param {Object} request The incoming request to API Gateway
     */
    start(request) {
        // start DB connections to all mysql services
        const services = [];
        for (const service in this.$services) {
            if (this.$services[service].name === 'mysql') {
                services.push(this.$services[service].connect().catch((error) => {
                    console.log('Check ALL connection settings: ' + error.message, JSON.stringify(error.stack));
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
    end(response) {
        // stop DB connections to all mysql services
        const services = [];
        for (const service in this.$services) {
            if (this.$services[service].name === 'mysql') {
                services.push(this.$services[service].end().catch((error) => {
                    console.log('Check ALL connection settings: ' + error.message, JSON.stringify(error.stack));
                }));
            }
        }
        return Promise.all(services).then(() => response);
    }
}
//# sourceMappingURL=Mysql.js.map