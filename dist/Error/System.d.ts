/**
 * @module express-api/Error/System
 * @class System
 * @extends Error
 * @description System class to give extended error functionality as a rest error, for returning back to client
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class SystemError extends Error {
    name: string;
    exception: boolean;
    message: string;
    details: any;
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     * @param {String} message The message to pass in as the error message
     * @param {Mixed} details Any data to capture
     * @param {string} logging logging: 'all' | 'error' | 'warning' | 'info' | 'none'
     */
    constructor(message: string, details?: any, logging?: string);
}
//# sourceMappingURL=System.d.ts.map