import DataTools from '../Library/DataTools';
import { RouteType } from '../Types/System';
import { GlobalsType } from '../Types/System';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

// Helper to get __dirname equivalent in both CommonJS and ES modules
const getDirname = () => {
	try {
		// @ts-ignore - __dirname may be available in CommonJS context
		if (typeof __dirname !== 'undefined') return __dirname;
		// ES module fallback
		return dirname(fileURLToPath(import.meta.url));
	} catch {
		return 'unknown';
	}
};

// Create require function for ES modules
const require = createRequire(import.meta.url);

/**
 * @module express-api/System/Request
 * @class Request
 * @description System class to give a base for all system classes, such as services, models, controllers
 * @author Paul Smith
 * @license MIT 
 */
export default class Request<
	T extends { context?: any; access?: any; resource?: any; headers?: { [key: string]: string | string[] | undefined }; body: any } = { context?: { [key: string]: any }, access?: { [key: string]: any }, resource?: { name: string, method: string, path: string }, headers?: { [key: string]: string | string[] | undefined }, body: any; },
	G extends GlobalsType = GlobalsType
> {
	private globals: G;
	
	public type: 'aws' | 'azure' | 'express' | 'socket';
	public source!: string;
	public context!: T['context'];
	public access!: T['access'];
	public method!: string;
	public path!: string;
	public resource!: T['resource'];
	public parameters!: { path: object, query: object };
	public headers!: T['headers'];
	public body!: T['body'];
	public requests!: Request[];

	constructor (globals: G, type: Request['type'], data: any) {
		const types = ['aws', 'azure', 'express', 'socket'];
		if (types.indexOf(type) < 0) throw Error('Type does not exist, please add a type of request [' + types.join(', ') + ']');
		
		this.globals = globals;
		this.type = type;

		(this as any)[`_${this.type}Parse`](data);
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _awsParse(data: any): void {
		// API Gateway, run and return
		if (data.httpMethod) {
			this.source = 'route';
			return this[`_${this.type}Route`](data);
		}

		// array of events, collect events and return
		if (data.Records || data.rmqMessagesByQueue) {
			// preset many
			this.requests = [];
			this.source = 'events';

			// events wrapped in records array
			if (data.Records) {
				for (const record of data.Records) this.requests.push(new Request(this.globals as any, this.type, record));
				return;
			}

			// rabbit events with wrapped message array
			if (data.rmqMessagesByQueue) {
				// run through all queues
				for (const q in data.rmqMessagesByQueue) {
					// run through all messages
					for (let i = 0; i < data.rmqMessagesByQueue[q].length; i++) {
						// wrap messages in common event object
						this.requests.push(new Request(this.globals as any, this.type, {
							...data.rmqMessagesByQueue[q][i],
							eventSource: data.eventSource,
							eventSourceARN: (data.eventSourceArn || data.eventSourceARN) + ':' + q.split('::')[0]
						}));					
					}
				}
				return;
			}

			return; // ensure we dont process further in event of typos or updates...
		}

		// new remap data for event processing
		switch (data.eventSource) {
			case 'aws:sqs':
				data.context = { id: data.messageId, service: data.eventSource, receiptHandle: data.receiptHandle };
			break;
			case 'aws:rmq':
				data.context = { ...data.basicProperties, redelivered: data.redelivered };
				data.body = Buffer.from(data.data, 'base64').toString('utf8');
			break;
		}

		// individual events, run and return
		this.source = 'event';
		(this as any)[`_${this.type}Event`](data);
	}

	/**
	 * @public @get _awsRoute
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _awsRoute(data: any): void {
		// normalize headers
		const headers: any = {};
		for (const key in data.headers) headers[DataTools.normalizeHeader(key)] = data.headers[key];

		// normalized request object
		this.context = { id: data.requestContext.requestId, ipAddress: data.requestContext.identity.sourceIp };
		this.method = data.httpMethod ? data.httpMethod.toLowerCase() : undefined;
		this.path = data.path

		let rpath = data.resource;
		if ((process as any).__EAPI_PATH_UNSHIFT) rpath = rpath.replace((process as any).__EAPI_PATH_UNSHIFT, '');
		if ((process as any).__EAPI_PATH_SHIFT) rpath = ((process as any).__EAPI_PATH_SHIFT) + rpath;

		this.resource = { path: data.resource === '/{error+}' ? undefined : (rpath === '/' || rpath === '' ? '/index' : data.resource) };
		this.parameters = { query: data.queryStringParameters || {}, path: data.pathParameters || {}};
		this.headers = headers;
		this.body = this._parseBody(data.body, headers['Content-Type']);
	}

	/**
	 * @private _awsEvent
	 * @desciption This is a single AWS event of unknown type (SQS compatible, Event Bridge compatible), try to handle it
	 * SQS, RMQ, event bridge etc...
	 * Nameing of event/queue is [system] double seperator [location] double seperator [controller]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:system-name--controller-name]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:system.name..controller.name]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:system_name__controller_name]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:systemName/controllerName]
	 * For system specific events all pointing to [system-name] system [src/Controller/ControllerName.js] controller [awsXxx] method
	 * 
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue-name]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue.name]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue_name]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queueName]
	 * For generic events on service for any type of system subscribed, pointing to subscribed system [src/Controller/QueueName.js] controller [awsXxx] method
	 * 
	 * Use double seperaters or slash in event/queue names to specify a sub folders in MVC
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue-name--something-else]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue.name..something.else]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue_name__something_else]
	 * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queueName/somethingElse]
	 * All point to [src/Controller/QueueName/SomethinElse.js] controller [awsXxx] method
	 * 
	 * for event bridge send in Input: '{"method": "get", "path": "controllerName"}' which will turn up on the data property
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _awsEvent(data: any): void {
		// convert aws:xxx to method name awsXxx
		const method = data.eventSource ? data.eventSource.toLowerCase().replace(/\:\w/g, (m: string) => m[1].toUpperCase()) : data.method; 
		
		// convert queue name to controller path as capital case
		const resource = (data.eventSourceArn || data.eventSourceARN || data.path)
			.split(':')
			.pop()
			.split(/--|__|\.\.|\/\/|\//)
			.map((p: string) => p.replace(/^\w/g, (m: string) => m[0].toUpperCase()).replace(/\-\w|\_\w|\.\w/g, (m: string) => m[1].toUpperCase()))
			.join('/'); 

		// normalized request object
		this.context = data.context;
		this.method = method;
		this.path = resource;
		this.resource = { path: '/' + resource };
		this.headers = { 'Content-Type': 'application/json' };
		this.body = this._parseBody(data.body || data, 'application/json');
	}

	/**
	 * @private _azureParse
	 * @desciption parse the azure request
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _azureParse(data: any): void {
		if (!data.req || !data.req.method || !data.req.url) throw Error('Azure integration only currently supports requests from http triggers');

		this.source = 'route';
		(this as any)[`_${this.type}Route`](data);
	}

	/**
	 * @public @get _azureRoute
	 * @desciption Handle the azure route data
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _azureRoute(data: any): void {
		// normalize headers
		const headers: any = {};
		for (const key in data.headers) headers[DataTools.normalizeHeader(key)] = data.headers[key];

		// normalized request object
		this.context = { id: data.invocationId, ipAddress: String(data.req.headers['x-forwarded-for'] || '') };
		this.method = data.req.method ? data.req.method.toLowerCase() : undefined;
		this.path = (data.req.originalUrl || data.req.url).replace(/https?:\/\/[a-zA-Z0-9_-]+[0-9:]+/, '').split('?')[0];

		// resolve function file
		try {
			const fnConfig = data.executionContext.functionConfig;
			const fn = typeof fnConfig === 'object' ? fnConfig : require(fnConfig || (data.executionContext.functionDirectory + '/function.json'));
			const bn = fn.bindings.find((b: any) => b.type.toLowerCase() === 'httptrigger' && b.direction.toLowerCase() === 'in');
			data.resource = bn.route;
		} catch(err) {
			throw Error('Cannot access azure function.json, please ensure you have a function.json file in a subfolder (as the function name) on root');
		}

		let rpath = data.resource;
		if ((process as any).__EAPI_PATH_UNSHIFT) rpath = rpath.replace((process as any).__EAPI_PATH_UNSHIFT, '');
		if ((process as any).__EAPI_PATH_SHIFT) rpath = ((process as any).__EAPI_PATH_SHIFT) + rpath;

		this.resource = { path: data.resource === '{*error}' || data.resource === '/{*error}' ? undefined : (rpath === '/' || rpath === '' ? '/index' : data.resource) };
		this.parameters = { query: data.req.query || {}, path: data.req.params || {} };
		this.headers = data.req.headers;
		this.body = this._parseBody(data.req.rawBody, (this.headers as any)['content-type']);
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _expressParse(data: any): void {
		this.source = 'route';
		(this as any)[`_${this.type}Route`](data);
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _expressRoute(data: any): void {
		const pwd = process.env.PWD || process.cwd() || '../';
		let routes: RouteType[] = [];
		const routesPath = pwd + '/' + (process.env._EAPI_ROUTES?.replace('.ts', '.js') || 'src/routes.js');
		const currentDir = getDirname();
		try { 
			const routesModule = require(routesPath);
			routes = routesModule.default || routesModule.routes || routesModule;
		}
		catch (e: any) { 
			throw Error(`Cannot locate routes file. Attempted path: ${routesPath}, Resolved from directory: ${currentDir}, Original error: ${e?.message || e}`) 
		}
		
		// normalize headers
		const headers: any = {};
		for (const key in data.headers) headers[DataTools.normalizeHeader(key)] = data.headers[key];

		// normalized request object
		this.context = { ipAddress: data.clientIp };
		this.method = data.method ? data.method.toLowerCase() : undefined;
		this.path = data.url.split('?')[0];
		
		// this needs to be a regex match on the above path to routes
		const resource = routes.find((r) => ((Array.isArray(r.method) && r.method.includes(this.method.toLowerCase()) || r.method === 'any' || r.method === this.method.toLowerCase())) && (new RegExp('^' + r.path.replace(/{.+\+}/g, '.+').replace(/{[^}]+}/g, '[^\/]+') + '$')).test(this.path));
		let keys: string[] = [];
		let values: string[] = [];
		if (resource && resource.path) {
			Array.from(resource.path.matchAll(new RegExp('^' + resource.path.replace(/{.+\+}/g, '(.+)').replace(/{[^}]+}/g, '([^\/]+)') + '$', 'g')), (m: any) => keys = m.slice(1, m.length).map((p: string) => p.replace(/{|}|\+/g, '')));
			Array.from(this.path.matchAll(new RegExp('^' + resource.path.replace(/{.+\+}/g, '(.+)').replace(/{[^}]+}/g, '([^\/]+)') + '$', 'g')), (m: any) => values = m.slice(1, m.length));
		
			let rpath = resource.path;
			if ((process as any).__EAPI_PATH_UNSHIFT) rpath = rpath.replace((process as any).__EAPI_PATH_UNSHIFT, '');
			if ((process as any).__EAPI_PATH_SHIFT) rpath = ((process as any).__EAPI_PATH_SHIFT) + rpath;
			
			this.resource = {
				name: resource.name,
				method: this.method.toLowerCase(),
				path: resource.path === '/{error+}' ? undefined : (rpath === '/' || rpath === '' ? '/index' : resource.path)
			};
		}

		// need to use a match to now pull any params out and stuff them in paramters under path
		this.parameters = { query: data.query || {}, path: this.resource && keys.length > 0 && values.length > 0 ? Object.assign({}, ...keys.map((k, i) => ({ [k]: values[i] }))) : {} };
		this.headers = headers;
		this.body = data.body;
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _socketParse(data: any): void {
		this.source = 'route';
		(this as any)[`_${this.type}Route`](data);
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _socketRoute(data: any): void {
		const pwd = process.env.PWD || process.cwd() || '../';
		let routes: RouteType[] = [];
		const routesPath = pwd + '/' + (process.env._EAPI_ROUTES?.replace('.ts', '.js') || 'src/routes.js');
		try { 
			const routesModule = require(routesPath);
			routes = routesModule.default || routesModule.routes || routesModule;
		}
		catch (e: any) { 
			throw Error(`Cannot locate routes file. Attempted path: ${routesPath}, Original error: ${e?.message || e}`) 
		}

		// normalize headers
		const headers: any = {};
		for (const key in data.socket.handshake.headers) headers[DataTools.normalizeHeader(key)] = data.socket.handshake.headers[key];

		// normalized request object
		this.context = { ipAddress: data.socket.handshake.address };
		this.method = 'socket';
		this.path = data.route.split('?')[0];

		// this needs to be a regex match on the above path to routes
		const resource = routes.find((r) => ((Array.isArray(r.method) && r.method.includes(this.method.toLowerCase()) || r.method === 'any' || r.method === this.method.toLowerCase())) && (new RegExp('^' + r.path.replace(/{.+\+}/g, '.+').replace(/{[^}]+}/g, '[^\/]+') + '$')).test(this.path));
		let keys: string[] = [];
		let values: string[] = [];
		let rpath: string = '';
		if (resource && resource.path) {
			Array.from(resource.path.matchAll(new RegExp('^' + resource.path.replace(/{.+\+}/g, '(.+)').replace(/{[^}]+}/g, '([^\/]+)') + '$', 'g')), (m: any) => keys = m.slice(1, m.length).map((p: string) => p.replace(/{|}|\+/g, '')));
			Array.from(this.path.matchAll(new RegExp('^' + resource.path.replace(/{.+\+}/g, '(.+)').replace(/{[^}]+}/g, '([^\/]+)') + '$', 'g')), (m: any) => values = m.slice(1, m.length));
			this.resource = {
				name: resource.name,
				method: this.method,
				path: resource.path === '/{error+}' ? undefined : (rpath === '/' || rpath === '' ? '/index' : resource.path)
			};
		}

		// need to use a match to now pull any params out and stuff them in paramters under path
		this.parameters = { query: {}, path: this.resource && keys.length > 0 && values.length > 0 ? Object.assign({}, ...keys.map((k, i) => ({ [k]: values[i] }))) : {} };
		this.headers = headers;
		this.body = this._parseBody(data.data, headers['Content-Type']);
	}

	/**
	 * @private _parseBody
	 * @desciption Parse the body of the request
	 * @param {any} body The body of the request
	 * @param {string} type The type of the body
	 * @return {any} The parsed body
	 */
	// @ts-ignore - Method is called dynamically via bracket notation in constructor
	private _parseBody(body: any, type: string): any {
		// convert body
		switch (type) {
			case 'application/json': try { return JSON.parse(body) } catch (e) { return body }
			default: return body;
		}
	}
}

