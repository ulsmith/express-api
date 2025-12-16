import DataTools from '../Library/DataTools';

/**
 * @module express-api/System/Response
 * @class Response
 * @description System class to give a base for all system classes, such as services, models, controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT 
 */
export default class Response<T extends { headers: { [key: string]: string | string[] | undefined }, body: any } = { headers: { [key: string]: string | string[] | undefined }, body: any }> {
	
	public type: 'aws' | 'azure' | 'express' | 'socket';
	public status!: number;
	public headers!: T['headers'];
	public body!: T['body'];
	public isBase64Encoded!: boolean;

	constructor (type: Response['type'], data: any) {
		const types = ['aws', 'azure', 'express', 'socket'];
		if (types.indexOf(type) < 0) throw Error('Type does not exist, please add a type of request [' + types.join(', ') + ']');

		this.type = type;
		this.set(data);
	}

	get(): any {
		return this[`_${this.type}Convert`]();
	}

	set(data: any) {
		const headers: any = {};
		if (data.headers) {
			for (const key in data.headers) headers[DataTools.normalizeHeader(key)] = data.headers[key];
			this.headers = headers;
		}

		if (data.status) this.status = data.status;
		if (data.body !== undefined) this.body = this._parseBody(data.body, headers['Content-Type']);
		if (data.isBase64Encoded !== undefined) this.isBase64Encoded = data.isBase64Encoded;
	}

	private _parseBody(body: any, type: string): any {
		// convert body
		switch (type) {
			case 'application/json': try { return JSON.stringify(body) } catch (e) { return JSON.stringify(null) }
			default: return body;
		}
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	private _awsConvert(): any {
		// return nromalized request object
		return {
			statusCode: this.status,
			headers: this.headers,
			body: this.body,
			isBase64Encoded: this.isBase64Encoded
		}
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	private _azureConvert(): any {
		// return nromalized request object
		return {
			status: this.status,
			headers: this.headers,
			body: this.body
		}
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	private _expressConvert(): any {
		// return nromalized request object
		return {
			status: this.status,
			headers: this.headers,
			body: this.body
		}
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	private _socketConvert(): any {
		return;
	}
}

