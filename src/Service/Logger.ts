import Service from '../Base/Service';
import { GlobalsType } from '../Types/System';
import Request from '../System/Request';
import Response from '../System/Response';
import { IncomingHttpHeaders } from 'http';
import ZodSchemaTools from '../Library/ZodSchemaTools';
import { z } from 'zod';
import type { CorrelationContext } from '../Base/Service/ExpressApiService';

export type LogType = 'info' | 'warning' | 'error';

export type LogPayload = {
	error?: Error;
	request?: Request;
	response?: Response;
	dump?: any;
};

/**
 * @module express-api/Service/Logger
 * @class Logger
 * @extends Service
 * @description Console logging service. Subclass and override write() to push logs to a remote express-api logger service.
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Logger<T extends GlobalsType & { $client: { correlation?: CorrelationContext; controller?: { zodSchema?: Record<string, any> } } }> extends Service<T> {
	public service: string = 'logger';

	/**
	 * @protected shouldLog
	 * @description Whether the given log type should be written based on EAPI_LOGGING
	 */
	protected shouldLog(type: LogType): boolean {
		const level = this.$environment.EAPI_LOGGING || 'all';
		if (level === 'all') return true;
		if (level === 'info') return ['info', 'warning', 'error'].includes(type);
		if (level === 'warning') return ['warning', 'error'].includes(type);
		if (level === 'error') return type === 'error';
		return false;
	}

	/**
	 * @protected redactRequestBody
	 * @description Redact request body using controller zod schema when available
	 */
	protected redactRequestBody(body: any, method: string = 'get'): any {
		return ZodSchemaTools.redact(body, this.$client?.controller?.zodSchema?.[method]?.body ?? z.object({}));
	}

	/**
	 * @protected redactResponseBody
	 * @description Redact response body using controller zod schema when available
	 */
	protected redactResponseBody(body: any, method: string = 'get', status: number = 200): any {
		let parsedBody = body;
		try {
			parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
		} catch (_) {}

		return ZodSchemaTools.redact(
			parsedBody,
			this.$client?.controller?.zodSchema?.[method]?.response?.[status]?.schema ?? z.object({}),
		);
	}

	/**
	 * @protected buildLogData
	 * @description Build structured log data from a payload
	 */
	protected buildLogData(payload?: LogPayload): Record<string, any> {
		if (payload?.dump) {
			console.log('\nLOGGER NOTICE: LOG DUMP DATA DETECTED - Ensure you redact any sensitive data before logging dump data !!!');
		}

		const requestBody = payload?.request
			? this.redactRequestBody(payload.request.body, payload.request.method)
			: undefined;
		const responseBody = payload?.response
			? this.redactResponseBody(payload.response.body, payload.response.method, payload.response.status)
			: undefined;

		return {
			request: payload?.request
				? { path: payload.request.path, method: payload.request.method, headers: payload.request.headers, body: requestBody }
				: undefined,
			response: payload?.response
				? { path: payload.response.path, method: payload.response.method, status: payload.response.status, headers: payload.response.headers, body: responseBody }
				: undefined,
			error: payload?.error?.message,
			dump: payload?.dump,
		};
	}

	/**
	 * @protected write
	 * @description Write a log entry. Override in a subclass to push to a remote logger service.
	 */
	protected write(type: LogType, title: string, correlation: CorrelationContext, data: Record<string, any>): void {
		if (!this.shouldLog(type)) return;
		console.log(`\nLOG [${type}, ${title}, ${correlation.id || ''}]: ${JSON.stringify(data)}\n`);
	}

	/**
	 * @public @async log
	 * @description Log a message with optional request/response context
	 */
	async log(type: LogType, title: string, payload?: LogPayload): Promise<void> {
		const correlation = this.$client?.correlation || { id: '' };
		const data = this.buildLogData(payload);
		this.write(type, title, correlation, data);
	}

	/**
	 * @public @async logHandler
	 * @description Log combined handler request/response context
	 */
	async logHandler(payload?: {
		request?: { path: string; method: string; headers: IncomingHttpHeaders; body: Record<string, string> };
		response?: Response;
		error?: Error;
	}): Promise<void> {
		const correlation = this.$client?.correlation || { id: '' };
		const type: LogType = payload?.error ? 'error' : 'info';
		const title = payload?.error ? 'Error' : 'Info';

		const requestBody = payload?.request
			? this.redactRequestBody(payload.request.body, payload.request.method)
			: undefined;
		const responseBody = payload?.response
			? this.redactResponseBody(payload.response.body, payload.response.method, payload.response.status)
			: undefined;

		const data = {
			request: payload?.request
				? { path: payload.request.path, method: payload.request.method, headers: payload.request.headers, body: requestBody }
				: undefined,
			response: payload?.response
				? { path: payload.response.path, method: payload.response.method, status: payload.response.status, headers: payload.response.headers, body: responseBody }
				: undefined,
			error: payload?.error?.message,
		};

		this.write(type, title, correlation, data);
	}

	/**
	 * @public @async logRequest
	 * @description Log an incoming request
	 */
	async logRequest(request: Request): Promise<void> {
		const correlation = this.$client?.correlation || { id: '' };
		const body = this.redactRequestBody(request.body, request.method);
		const data = { request: { path: request.path, method: request.method, headers: request.headers, body } };
		this.write('info', 'Request', correlation, data);
	}

	/**
	 * @public @async logResponse
	 * @description Log an outgoing response
	 */
	async logResponse(response: Response): Promise<void> {
		const correlation = this.$client?.correlation || { id: '' };
		const type: LogType = response.status >= 500 ? 'error' : response.status >= 400 ? 'warning' : 'info';
		const title = response.status >= 500 ? 'Response Error' : response.status >= 400 ? 'Response Warning' : 'Response Info';
		const body = this.redactResponseBody(response.body, response.method, response.status);
		const data = { response: { path: response.path, method: response.method, status: response.status, headers: response.headers, body } };
		this.write(type, title, correlation, data);
	}
}
