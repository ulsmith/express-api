import Middleware from '../Base/Middleware.js';
import { GlobalsType } from '../Types/System.js';
/**
 * @module express-api/Middleware/Amqp
 * @class Amqp
 * @extends Middleware
 * @description Middleware class providing Amqp DB connection handling on incomming event and outgoing response
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Amqp<T extends GlobalsType> extends Middleware<T> {
    /**
     * @public @method start
     * @description Invoke middleware for incoming request
     * @param {Object} request The incoming request to API Gateway
     */
    start(request: any): Promise<any>;
    /**
     * @public @method end
     * @description Invoke middleware for outgoing response
     * @param {Object} response The outgoing response to API Gateway
     */
    end(response: any): Promise<any>;
}
//# sourceMappingURL=Amqp.d.ts.map