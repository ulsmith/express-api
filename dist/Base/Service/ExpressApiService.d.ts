import Service from '../Service.js';
import { ReadableStream } from 'stream/web';
import { GlobalsType } from '../../Types/System.js';
export type CorrelationContext = {
    id: string;
    userId?: string;
    companyId?: string;
    impersonatorId?: string;
};
/**
 * @module express-api/Base/Service/ExpressApiService
 * @class ExpressApiService
 * @extends Service
 * @description Base class for HTTP clients that call other services built with this framework
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ExpressApiService<T extends GlobalsType & {
    $client: {
        correlation?: CorrelationContext;
    };
}> extends Service<T> {
    service: string;
    /**
     * @protected correlationHeaders
     * @description Build correlation headers for outbound requests
     */
    protected correlationHeaders(): Record<string, string>;
    /**
     * @public @async fetch
     * @description Make a fetch request to another express-api service
     * @param endpoint The endpoint to send the request to
     * @param options The options to go with the request
     * @return Promise a resulting promise with data or RestError
     */
    fetch<R>(endpoint: string, options: {
        method: string;
        body: string;
        headers?: Record<string, string> | Headers;
    }): Promise<R>;
    /**
     * @public fetchEventStream
     * @description Make a fetch request and return a readable stream with parsed JSON chunks
     * @param endpoint The endpoint to send the request to
     * @param options The options to go with the request
     * @return ReadableStream a readable stream of parsed JSON objects
     */
    fetchEventStream<R>(endpoint: string, options: {
        method: string;
        body: string;
        headers?: Record<string, string> | Headers;
    }): ReadableStream<R>;
}
//# sourceMappingURL=ExpressApiService.d.ts.map