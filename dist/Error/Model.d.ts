/**
 * @module express-api/Error/Model
 * @class Model
 * @extends Error
 * @description Model class to give extended error functionality as a rest error, for returning back data specific error from a model
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ModelError extends Error {
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
//# sourceMappingURL=Model.d.ts.map