/**
 * @module express-api/Error/Rest
 * @class Rest
 * @extends Error
 * @description System class to give extended error functionality as a rest error, for returning back to client
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class RestError extends Error {
    name: string;
    exception: boolean;
    message: string;
    status: number;
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     * @param {String} message The message to pass in as the error message
     * @param {Number} code The rest error code to output, along with the message
     * @param {string} logging logging: 'all' | 'error' | 'warning' | 'info' | 'none'
     */
    constructor(message: string, code: number, logging?: string);
}
//# sourceMappingURL=Rest.d.ts.map