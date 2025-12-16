import Middleware from '../Base/Middleware.js';
import { GlobalsType } from '../Types/System.js';
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
    out(response: any): any;
}
//# sourceMappingURL=Cors.d.ts.map