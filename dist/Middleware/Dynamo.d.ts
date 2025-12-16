import Middleware from '../Base/Middleware.js';
import { GlobalsType } from '../Types/System.js';
/**
 * @module express-api/Middleware/Dynamo
 * @class Dynamo
 * @extends Middleware
 * @description Middleware class providing Dynamo DB connection handling on incomming event and outgoing response
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Dynamo<T extends GlobalsType> extends Middleware<T> {
    /**
     * @public @method start
     * @description Invoke middleware for incoming request
     * @param {Object} request The incoming request to API Gateway
     */
    start(request: any): Promise<any>;
}
//# sourceMappingURL=Dynamo.d.ts.map