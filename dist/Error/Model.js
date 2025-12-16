/**
 * @module express-api/Error/Model
 * @class Model
 * @extends Error
 * @description Model class to give extended error functionality as a rest error, for returning back data specific error from a model
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ModelError extends Error {
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     * @param {String} message The message to pass in as the error message
     * @param {Mixed} details Any data to capture
     * @param {string} logging logging: 'all' | 'error' | 'warning' | 'info' | 'none'
     */
    constructor(message, details, logging) {
        // Pass remaining arguments (including vendor specific ones) to parent constructor
        super(message);
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, ModelError);
        this.name = 'ModelError';
        this.exception = true;
        this.message = message;
        this.details = details || {};
        if (['all', 'error'].includes(logging?.toLowerCase() || ''))
            console.log(this);
    }
}
//# sourceMappingURL=Model.js.map