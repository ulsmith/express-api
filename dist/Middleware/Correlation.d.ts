import { GlobalsType } from '../Types/System.js';
import Middleware from '../Base/Middleware.js';
import Request from '../System/Request.js';
import Response from '../System/Response.js';
import type { CorrelationContext } from '../Base/Service/ExpressApiService.js';
/**
 * @module express-api/Middleware/Correlation
 * @class Correlation
 * @extends Middleware
 * @description Middleware for correlation and identity context on incoming requests
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Correlation<T extends GlobalsType & {
    $client: {
        correlation?: CorrelationContext;
    };
}> extends Middleware<T> {
    private type;
    constructor(globals: T, type: 'api' | 'service');
    /**
     * @public @method mount
     * @description Invoke middleware for incoming event at mount time
     * @param request The incoming request
     * @returns The updated request
     */
    mount(request: Request): Promise<Request>;
    /**
     * @public @method in
     * @description Invoke middleware for incoming event at in time
     * @param request The incoming request
     * @returns The updated request
     */
    in(request: Request): Promise<Request>;
    /**
     * @public @method out
     * @description Invoke middleware for outgoing event at out time
     * @param response The outgoing response
     * @returns The updated response
     */
    out(response: Response): Promise<Response>;
}
//# sourceMappingURL=Correlation.d.ts.map