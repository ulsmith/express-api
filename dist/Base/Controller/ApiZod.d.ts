import { z } from 'zod';
import Controller from '../Controller.js';
import Request from '../../System/Request.js';
import { OpenApiSchema } from '../../Library/ZodToOpenApi.js';
import { GlobalsType } from '../../Types/System.js';
import type { ZodSchema } from '../../Types/Zod.js';
export type { ZodSchema };
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
/**
 * Infer the TypeScript output type from a Zod schema via its _output branded property.
 * When S is a raw type (not a Zod schema) it passes through unchanged, so callers can
 * supply either `typeof MyController.zodSchema.get.params` or a plain `{ id: string }`.
 */
type ZodInfer<S> = S extends z.ZodType ? S['_output'] : S;
/**
 * @module express-api/Base/Controller/ApiZod
 * @class ApiZod
 * @extends Controller
 * @description Base class for API controllers using Zod schemas for validation and OpenAPI generation
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default abstract class ApiZod<T extends GlobalsType> extends Controller<T> {
    /**
     * @public @static @get zodSchema
     * @description Zod-based schema definitions for this endpoint. Override in subclass.
     * @returns The Zod schema definition for this endpoint
     */
    static get zodSchema(): ZodSchema;
    /**
     * @public @method options
     * @description Return metadata documentation on the endpoint as OpenAPI fragment (auto-converted from zodSchema)
     * @returns The documentation for this endpoint
     */
    options(): OpenApiSchema;
    /**
     * @public parseBody
     * @description Parse and validate the request body against the Zod schema defined in zodSchema().
     * Pass the schema type as a generic for compile-time inference:
     *   this.parseBody<typeof MyController.zodSchema.post.body>(request)
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns The validated body data
     */
    parseBody<S = any>(request: Request, method?: HttpMethod): ZodInfer<S>;
    /**
     * @public parsePathParameters
     * @description Parse and validate the path parameters against the Zod schema defined in zodSchema().
     * Pass the schema type as a generic for compile-time inference:
     *   this.parsePathParameters<typeof MyController.zodSchema.get.params>(request)
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns The validated path parameter data
     */
    parsePathParameters<S = any>(request: Request, method?: HttpMethod): ZodInfer<S>;
    /**
     * @public parseQueryParameters
     * @description Parse and validate the query parameters against the Zod schema defined in zodSchema().
     * Pass the schema type as a generic for compile-time inference:
     *   this.parseQueryParameters<typeof MyController.zodSchema.get.query>(request)
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns The validated query parameter data
     */
    parseQueryParameters<S = any>(request: Request, method?: HttpMethod): ZodInfer<S>;
    /**
     * @public parseOutput
     * @description Parse and validate response output against the Zod schema defined in zodSchema().
     * Pass the response schema type as a generic for compile-time inference:
     *   this.parseOutput<typeof MyController.zodSchema.post.response[200]['schema']>(data)
     * @param data The response data to send out in a response
     * @param method The optional method to use if auto detection fails
     * @param statusCode The HTTP status code to select the response schema (defaults to 200)
     * @returns The validated output data
     */
    parseOutput<S = any>(data: any, method?: HttpMethod, statusCode?: number): ZodInfer<S>;
    /**
     * @private __getMethodSchema
     * @description Get the ZodMethodSchema for a given HTTP method from zodSchema()
     * @param method The HTTP method
     * @returns The method schema
     */
    private __getMethodSchema;
    /**
     * @protected getCallingMethod
     * @description Attempts to detect the calling method name from the call stack
     * @returns The detected method name
     */
    protected getCallingMethod(): 'get' | 'post' | 'put' | 'patch' | 'delete';
}
//# sourceMappingURL=ApiZod.d.ts.map