/**
 * @module express-api/Error/System
 * @class System
 * @extends Error
 * @description System class to give extended error functionality as a rest error, for returning back to client
 * @author Paul Smith
 * @license MIT
 */
export default class SystemError extends Error {

	public name: string;
	public exception: boolean;
	public message: string;
	public details: any;

	/**
	 * @public @method constructor
	 * @description Base method when instantiating class
	 * @param {String} message The message to pass in as the error message
	 * @param {Mixed} details Any data to capture
	 * @param {string} logging logging: 'all' | 'error' | 'warning' | 'info' | 'none' 
	 */
	constructor(message: string, details?: any, logging?: string) {
		// Pass remaining arguments (including vendor specific ones) to parent constructor
		super(message);

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) Error.captureStackTrace(this, SystemError);

		this.name = 'SystemError';
		this.exception = true;
		this.message = message;
		this.details = details || {};

		if (['all', 'error'].includes(logging?.toLowerCase() || '')) console.log(this);
	}
}

