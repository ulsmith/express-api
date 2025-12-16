import Request from './Request';
import Response from './Response';
import Path from 'path';
import { GlobalsType, ServiceType, MiddlewareType } from '../Types/System';

/**
 * @module express-api/System/Application
 * @class Applications
 * @description System application handler
 * @author Paul Smith
 * @license MIT
 */
export default class Application<T extends GlobalsType & { $handler?: { file: string; type: 'es-module' | 'module' } }> {
	
	public globals: T;
	private request: any;
	private _middleware: { start: any[], mount: any[], in: any[], out: any[], end: any[]};
	private _controller: { [key: string]: any };
	private _types: string[];
	private _type: 'aws' | 'azure' | 'express' | 'socket';
	private _pwd: string;
	private _controllerDir: string;

	constructor(request: any, type: 'aws' | 'azure' | 'express' | 'socket' = 'express') {
		this.request = request;
		this.globals = {} as T;
		this.globals.$services = {};
		this.globals.$environment = {};
		this.globals.$handler = { file: '', type: 'es-module' };
		this._middleware = { start: [], mount: [], in: [], out: [], end: []};
		this._controller = {};
		this._types = ['aws', 'azure', 'express', 'socket'];

		if (this._types.indexOf(type) < 0) throw Error('Type does not exist, please add a type of request [' + this._types.join(', ') + ']');
		this._type = type;

		// check required env vars
		if (!process.env._EAPI_CONTROLLER_PATH) console.warn('Controller directory not set, please set the _EAPI_CONTROLLER_PATH, defaulting to src/Controller');
		if (!process.env._EAPI_HANDLER_FILE) console.warn('Handler file not set, please set the _EAPI_HANDLER_FILE, defaulting to src/handler.js');
		if (!process.env._EAPI_ROUTES_FILE) console.warn('Routes file not set, please set the _EAPI_ROUTES_FILE, defaulting to src/routes.js');

		// get env vars
		this.globals.$environment = {};
		for (const key in process.env) if (key.startsWith('EAPI_')) this.globals.$environment[key] = process.env[key] || '';

		// get controller path
		this._pwd = process.env.PWD || process.cwd() || '../';
		this._controllerDir = this._pwd + '/' + (process.env._EAPI_CONTROLLER_PATH?.replace('.ts', '.js') || 'src/Controller');

		// ensure any required system env vars are set and available system wide at route process (not affected by shared process as system wide)
		const file = process.env._EAPI_HANDLER?.replace('.ts', '.js') || 'src/handler.js';
		this.globals.$handler.file = file;
		this.globals.$environment.EAPI_TYPE = type;
		this.globals.$environment.EAPI_NAME = this.globals.$environment.EAPI_NAME || 'ExpressAPI';
		this.globals.$environment.EAPI_ADDRESS = this.globals.$environment.EAPI_ADDRESS || 'localhost';
		this.globals.$environment.EAPI_VERSION = this.globals.$environment.EAPI_VERSION || 'x.x.x';
		this.globals.$environment.EAPI_MODE = this.globals.$environment.EAPI_MODE || 'development';
		this.globals.$environment.EAPI_CORS_LIST = this.globals.$environment.EAPI_CORS_LIST || 'http://localhost,http://localhost:5173,http://localhost:4173';
		this.globals.$environment.EAPI_LOGGING = this.globals.$environment.EAPI_LOGGING || 'all';
	}

	service<TS extends ServiceType | ServiceType[]>(s: TS): void {
		const services : ServiceType[] = !Array.isArray(s) ? [s] : s;
		for (let i = 0; i < services.length; i++) if (services[i].service) this.globals.$services[services[i].service] = services[i];
	}

	middleware<TM extends MiddlewareType | MiddlewareType[]>(mw: TM): void {
		const middlewares : MiddlewareType[] = !Array.isArray(mw) ? [mw] : mw; 
		for (let i = 0; i < middlewares.length; i++) {
			if (middlewares[i].start) this._middleware.start.push(middlewares[i]);
			if (middlewares[i].mount) this._middleware.mount.push(middlewares[i]);
			if (middlewares[i].in) this._middleware.in.push(middlewares[i]);
			if (middlewares[i].out) this._middleware.out.push(middlewares[i]);
			if (middlewares[i].end) this._middleware.end.push(middlewares[i]);
		}
	}

	middlewareInit<TMI extends MiddlewareType | MiddlewareType[]>(mw: TMI): void {
		const middlewares : MiddlewareType[] = !Array.isArray(mw) ? [mw] : mw;
		for (let i = 0; i < middlewares.length; i++) if (middlewares[i].start) this._middleware.start.push(middlewares[i]);
	}

	middlewareMount<TMM extends MiddlewareType | MiddlewareType[]>(mw: TMM): void {
		const middlewares : MiddlewareType[] = !Array.isArray(mw) ? [mw] : mw;
		for (let i = 0; i < middlewares.length; i++) if (middlewares[i].mount) this._middleware.mount.push(middlewares[i]);
	}

	middlewareIn<TMIN extends MiddlewareType | MiddlewareType[]>(mw: TMIN): void {
		const middlewares : MiddlewareType[] = !Array.isArray(mw) ? [mw] : mw;
		for (let i = 0; i < middlewares.length; i++) if (middlewares[i].in) this._middleware.in.push(middlewares[i]);
	}

	middlewareOut<TMO extends MiddlewareType | MiddlewareType[]>(mw: TMO): void {
		const middlewares : MiddlewareType[] = !Array.isArray(mw) ? [mw] : mw;
		for (let i = 0; i < middlewares.length; i++) if (middlewares[i].out) this._middleware.out.push(middlewares[i]);
	}

	middlewareEnd<TME extends MiddlewareType | MiddlewareType[]>(mw: TME): void {
		const middlewares : MiddlewareType[] = !Array.isArray(mw) ? [mw] : mw;
		for (let i = 0; i < middlewares.length; i++) if (middlewares[i].end) this._middleware.end.push(middlewares[i]);
	}

	async run(): Promise<any> {
		let promises: Promise<any>[] = [];
		let request = new Request(this.globals, this._type, this.request);
		let requests = request.requests || [request];

		// run middleware before anything mounted or checked
		requests = await this._middleware.start.reduce((p: Promise<any>, mw: any) => p.then((r) => mw.start(r)), Promise.resolve(requests));

		if (this.request.socket) this.globals.$socket = this.request.socket;
		if (this.request.io) this.globals.$io = this.request.io;

		for (const request of requests) {
			if (!request.resource || !request.resource.path) {
				return Promise.resolve((new Response(this._type, {
					status: 404,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': request && request.headers && request.headers.Origin ? request.headers.Origin : '*',
						'Access-Control-Allow-Credentials': 'true',
						'Access-Control-Allow-Headers': 'Accept, Cache-Control, Content-Type, Content-Length, Authorization, Pragma, Expires',
						'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
						'Access-Control-Expose-Headers': 'Cache-Control, Content-Type, Authorization, Pragma, Expires'
					},
					body: `404 Not Found [${request.path}]`
				})).get()).then((res) => this._middleware.end.reduce((p: Promise<any>, mw: any) => p.then((r: any) => mw.end(r)), Promise.resolve()).then(() => res)); // make sure we end any started middleware on failure
			}

			// process requests
			promises.push(this._process(request));
		}

		return Promise.all(promises)
			.then((responses: any[]) => responses.length < 2 ? responses[0].get() : (new Response(this._type, { status: 200, headers: { 'Content-Type': 'application/json' }, body: responses.map((r) => r.get().body) })).get())
			.catch((error: any) => {
				// Log error and return appropriate response
				console.error('Error processing requests:', error);
				return Promise.resolve((new Response(this._type, { status: 400, headers: { 'Content-Type': 'application/json' }, body: { message: '400 Could not process all requests', detail: error.message || 'Unknown error' } })).get());
			})
			.then((responses: any) => this._middleware.end.reduce((p: Promise<any>, mw: any) => p.then((r: any) => mw.end(r)), Promise.resolve(responses)));
	}

	private _process(request: any): Promise<any> {
		return Promise.resolve(request)
			// create client object
			.then((req) => {
				this.globals.$client = { origin: req.headers.Origin || req.headers.origin };
				return req;
			})

			// mount middleware, before controller is resolved for each request, run synchronously as each one impacts on the next
			.then((req) => this._middleware.mount.reduce((p: Promise<any>, mw: any) => p.then((r: any) => mw.mount(r)), Promise.resolve(req)))

			// run controller and catch errors
			.then(async (req) => {
				// parse resource to name and path 
				let path = '', name = '';
				
				// adjust path prefix
				let rpath = req.resource.path;
				if (this.globals.$environment.EAPI_PATH_UNSHIFT || this.globals.$environment.PATH_UNSHIFT) rpath = rpath.replace(this.globals.$environment.EAPI_PATH_UNSHIFT || this.globals.$environment.PATH_UNSHIFT, '');
				if (this.globals.$environment.EAPI_PATH_SHIFT || this.globals.$environment.PATH_SHIFT) rpath = (this.globals.$environment.EAPI_PATH_SHIFT || this.globals.$environment.PATH_UNSHIFT) + rpath;

				// resolve name and path
				let resourcePath = rpath.split('/');
				for (let i = 0; i < resourcePath.length; i++) {
					if (!resourcePath[i]) continue;
					if (!resourcePath[i] || resourcePath[i].charAt(0) === '{') continue;
					name += resourcePath[i].replace(/\b[a-z]/g, (char: string) => { return char.toUpperCase() }).replace(/_|-|\s/g, '');
					path += resourcePath[i].replace(/\b[a-z]/g, (char: string) => { return char.toUpperCase() }).replace(/_|-|\s/g, '') + '/';
				}
				path = path.substring(0, path.length - 1) + '.js';

				try {
					this._controller[name] = (this.globals.$handler?.type === 'es-module' ? Object.values(await import(this._controllerDir.replace(/(\/)+$/, '') + '/' + path))[0] : require(this._controllerDir.replace(/(\/)+$/, '') + '/' + path));
					req.access = this._controller[name][req.method] || {};
				} catch (error: any) {
					// catch any other errors, log errors to console
					if (!error.exception) console.warn(error.message, JSON.stringify(error.stack));

					if (error.message.toLowerCase().indexOf('cannot find module') >= 0) {
						return Promise.resolve((new Response(this._type, {
							status: 409,
							headers: {
								'Content-Type': 'application/json',
								'Access-Control-Allow-Origin': req && req.headers && req.headers.Origin ? req.headers.Origin : '*',
								'Access-Control-Allow-Credentials': 'true',
								'Access-Control-Allow-Headers': 'Accept, Cache-Control, Content-Type, Content-Length, Authorization, Pragma, Expires',
								'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
								'Access-Control-Expose-Headers': 'Cache-Control, Content-Type, Authorization, Pragma, Expires'
							},
							body: `409 Resource missing for [${req.path}], cannot resolve controller automatically due to incorrect PWD on host, or incorrect controllerDir set`
						})).get());
					}

					return Promise.resolve((new Response(this._type, {
						status: 500,
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': req && req.headers && req.headers.Origin ? req.headers.Origin : '*',
							'Access-Control-Allow-Credentials': 'true',
							'Access-Control-Allow-Headers': 'Accept, Cache-Control, Content-Type, Content-Length, Authorization, Pragma, Expires',
							'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
							'Access-Control-Expose-Headers': 'Cache-Control, Content-Type, Authorization, Pragma, Expires'
						},
						body: `500 Server Error [${req.path}]`
					})).get());
				}

				// instantiate and check
				const controller = new this._controller[name](this.globals);
				if (!controller[req.method]) {
					return Promise.resolve((new Response(this._type, {
						status: 405,
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': req && req.headers && req.headers.Origin ? req.headers.Origin : '*',
							'Access-Control-Allow-Credentials': 'true',
							'Access-Control-Allow-Headers': 'Accept, Cache-Control, Content-Type, Content-Length, Authorization, Pragma, Expires',
							'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
							'Access-Control-Expose-Headers': 'Cache-Control, Content-Type, Authorization, Pragma, Expires'
						},
						body: `405 Method not allowed [${req.method}] for [${req.path}]`
					})).get());
				}

				// run middleware after mount of controller but before running it
				req = await this._middleware.in.reduce((p: Promise<any>, mw: any) => p.then((r: any) => mw.in(r)), Promise.resolve(req));

				// run controller
				return (new this._controller[name](this.globals))[req.method](req);
			})

			// handle response
			.then((out) => new Response(this._type, {
				isBase64Encoded: out && out.isBase64Encoded,
				status: out && out.body && out.status ? out.status : 200,
				headers: { ...{ 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }, ...(out && out.body && out.headers ? out.headers : {}) },
				body: out && out.body && out.status ? out.body : (out ? out : null)
			}))
			.catch((error: any) => {
				// catch any other errors, log errors to console
				if (!error.exception) console.warn(error.message, JSON.stringify(error.stack));

				// other errors like model, service etc (custom)
				return new Response(this._type, {
					status: ['error', 'typeerror'].includes(error.name.toLowerCase()) ? 500 : error.status || 400,
					headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
					body: error.name.toLowerCase() === 'resterror' ? error.message : (['error', 'typeerror'].includes(error.name.toLowerCase()) ? 'internal error' : error)
				});
			})
			
			// outgoing middleware, run synchronously as each one impacts on the next
			.then((response) => this._middleware.out.reduce((p: Promise<any>, mw: any) => p.then((r: any) => mw.out(r)), Promise.resolve(response)))

			// finally catch any last issues in middleware and output, important to ensure middleware can run in event of ocntroller error
			.catch((error: any) => {
				// catch any other errors, log errors to console
				if (!error.exception) console.warn(error.message, JSON.stringify(error.stack));

				// other errors like model, service etc (custom)
				return new Response(this._type, {
					status: error.name.toLowerCase() === 'error' ? 500 : error.status || 400,
					headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
					body: error.name.toLowerCase() === 'resterror' ? error.message : (error.name.toLowerCase() === 'error' ? 'system error' : error)
				});
			});
	}
}

