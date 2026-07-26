import Service from '../Service.js';
import RestError from '../../Error/Rest.js';
import { ReadableStream } from 'stream/web';
import { Readable } from 'stream';
const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
/**
 * @module express-api/Base/Service/ExpressApiService
 * @class ExpressApiService
 * @extends Service
 * @description Base class for HTTP clients that call other services built with this framework
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ExpressApiService extends Service {
    constructor() {
        super(...arguments);
        this.service = '';
    }
    /**
     * @protected correlationHeaders
     * @description Build correlation headers for outbound requests
     */
    correlationHeaders() {
        return {
            'X-Correlation-Id': this.$client.correlation?.id?.toString() || ZERO_UUID,
            'X-User-Id': this.$client.correlation?.userId?.toString() || ZERO_UUID,
            'X-Company-Id': this.$client.correlation?.companyId?.toString() || ZERO_UUID,
            'X-Impersonator-Id': this.$client.correlation?.impersonatorId?.toString() || ZERO_UUID,
        };
    }
    /**
     * @public @async fetch
     * @description Make a fetch request to another express-api service
     * @param endpoint The endpoint to send the request to
     * @param options The options to go with the request
     * @return Promise a resulting promise with data or RestError
     */
    async fetch(endpoint, options) {
        options.headers = {
            'Content-Type': 'application/json',
            ...options.headers,
            ...this.correlationHeaders(),
        };
        const transientCodes = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN', 'ENOTFOUND', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT'];
        const maxAttempts = 3;
        let res;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                res = await fetch(endpoint, options);
                break;
            }
            catch (error) {
                const code = error?.cause?.code || error?.code;
                if (attempt >= maxAttempts || !transientCodes.includes(code)) {
                    throw new RestError('Could not contact backend system services, please try again later', 500);
                }
                await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
            }
        }
        const out = !res.body
            ? { status: res.status, data: res.body }
            : { status: res.status, data: await res.json() };
        if (out.status >= 400)
            throw new RestError(out.data, out.status);
        return out.data;
    }
    /**
     * @public fetchEventStream
     * @description Make a fetch request and return a readable stream with parsed JSON chunks
     * @param endpoint The endpoint to send the request to
     * @param options The options to go with the request
     * @return ReadableStream a readable stream of parsed JSON objects
     */
    fetchEventStream(endpoint, options) {
        options.headers = {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            ...options.headers,
            ...this.correlationHeaders(),
        };
        const fetchPromise = fetch(endpoint, options).catch(() => {
            throw new RestError('Could not contact backend system services, please try again later', 500);
        });
        return new ReadableStream({
            async start(controller) {
                try {
                    const res = await fetchPromise;
                    if (res.status >= 400) {
                        let errorMessage;
                        try {
                            const errorData = await res.json();
                            errorMessage = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
                        }
                        catch {
                            try {
                                errorMessage = await res.text();
                            }
                            catch {
                                errorMessage = `Error ${res.status}: ${res.statusText}`;
                            }
                        }
                        return controller.error(new RestError(errorMessage, res.status));
                    }
                    if (!res.body)
                        return controller.error(new RestError('Response body is empty', 500));
                    let bodyStream;
                    if (res.body instanceof Readable || ('pipe' in res.body && typeof res.body.getReader !== 'function')) {
                        bodyStream = Readable.toWeb(res.body);
                    }
                    else if (typeof res.body?.getReader === 'function') {
                        bodyStream = res.body;
                    }
                    else {
                        bodyStream = Readable.toWeb(res.body);
                    }
                    const decoder = new TextDecoder();
                    let buffer = '';
                    for await (const value of bodyStream) {
                        const decoded = decoder.decode(value, { stream: true });
                        buffer += decoded;
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (trimmed.startsWith('data: ')) {
                                try {
                                    const jsonStr = trimmed.slice(6);
                                    const parsed = JSON.parse(jsonStr);
                                    controller.enqueue(parsed);
                                }
                                catch {
                                    // skip invalid JSON chunks
                                }
                            }
                        }
                    }
                    controller.close();
                }
                catch (error) {
                    controller.error(error);
                }
            },
        });
    }
}
//# sourceMappingURL=ExpressApiService.js.map