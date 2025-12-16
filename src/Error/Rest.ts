/**
 * @module express-api/Error/Rest
 * @class Rest
 * @extends Error
 * @description System class to give extended error functionality as a rest error, for returning back to client
 * @author Paul Smith
 * @license MIT
 */
export default class RestError extends Error {

	public name: string;
	public exception: boolean;
	public message: string;
	public status: number;

	/**
	 * @public @method constructor
	 * @description Base method when instantiating class
	 * @param {String} message The message to pass in as the error message
	 * @param {Number} code The rest error code to output, along with the message
	 * @param {string} logging logging: 'all' | 'error' | 'warning' | 'info' | 'none' 
	 */
	constructor(message: string, code: number, logging?: string) {
		// Pass remaining arguments (including vendor specific ones) to parent constructor
		super(message);

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) Error.captureStackTrace(this, RestError);

		this.name = 'RestError';
		this.exception = true;
		this.message = message;
		this.status = code;

		if (['all', 'error'].includes(logging?.toLowerCase() || '')) console.log(this);
	}
}

