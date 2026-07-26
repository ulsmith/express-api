import Service from '../Base/Service.js';
import { GlobalsType } from '../Types/System.js';
import Request from '../System/Request.js';
import Response from '../System/Response.js';
import { IncomingHttpHeaders } from 'http';
import type { CorrelationContext } from '../Base/Service/ExpressApiService.js';
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
export default class Logger<T extends GlobalsType & {
    $client: {
        correlation?: CorrelationContext;
        controller?: {
            zodSchema?: Record<string, any>;
        };
    };
}> extends Service<T> {
    service: string;
    /**
     * @protected shouldLog
     * @description Whether the given log type should be written based on EAPI_LOGGING
     */
    protected shouldLog(type: LogType): boolean;
    /**
     * @protected redactRequestBody
     * @description Redact request body using controller zod schema when available
     */
    protected redactRequestBody(body: any, method?: string): any;
    /**
     * @protected redactResponseBody
     * @description Redact response body using controller zod schema when available
     */
    protected redactResponseBody(body: any, method?: string, status?: number): any;
    /**
     * @protected buildLogData
     * @description Build structured log data from a payload
     */
    protected buildLogData(payload?: LogPayload): Record<string, any>;
    /**
     * @protected write
     * @description Write a log entry. Override in a subclass to push to a remote logger service.
     */
    protected write(type: LogType, title: string, correlation: CorrelationContext, data: Record<string, any>): void;
    /**
     * @public @async log
     * @description Log a message with optional request/response context
     */
    log(type: LogType, title: string, payload?: LogPayload): Promise<void>;
    /**
     * @public @async logHandler
     * @description Log combined handler request/response context
     */
    logHandler(payload?: {
        request?: {
            path: string;
            method: string;
            headers: IncomingHttpHeaders;
            body: Record<string, string>;
        };
        response?: Response;
        error?: Error;
    }): Promise<void>;
    /**
     * @public @async logRequest
     * @description Log an incoming request
     */
    logRequest(request: Request): Promise<void>;
    /**
     * @public @async logResponse
     * @description Log an outgoing response
     */
    logResponse(response: Response): Promise<void>;
}
//# sourceMappingURL=Logger.d.ts.map