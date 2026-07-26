import { z } from 'zod';
import Controller from '../Controller.js';
import Request from '../../System/Request.js';
import { OpenApiSchema } from '../../Library/ZodToOpenApi.js';
import { GlobalsType } from '../../Types/System.js';
import type { ZodServiceSchema } from '../../Types/Zod.js';
export type { ZodServiceSchema };
/**
 * Infer the TypeScript output type from a Zod schema via its _output branded property.
 * When S is a raw type (not a Zod schema) it passes through unchanged, so callers can
 * supply either `typeof MyClass.zodSchema.post.body` or a plain `{ id: string }`.
 */
type ZodInfer<S> = S extends z.ZodType ? S['_output'] : S;
/**
 * @module express-api/Base/Controller/ServiceZod
 * @class ServiceZod
 * @extends Controller
 * @description Base class for service controllers using Zod schemas for validation and OpenAPI generation. Services are POST-only.
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default abstract class ServiceZod<T extends GlobalsType> extends Controller<T> {
    /**
     * @public @static @get zodSchema
     * @description Zod-based schema definitions for this service endpoint (post only). Override in subclass.
     * @returns The Zod schema definition for this endpoint
     */
    static get zodSchema(): ZodServiceSchema;
    /**
     * @public @method options
     * @description Return metadata documentation on the endpoint as OpenAPI fragment (auto-converted from zodSchema)
     * @returns The documentation for this endpoint
     */
    options(): OpenApiSchema;
    /**
     * @public parseBody
     * @description Parse and validate the request body against the Zod schema defined in zodSchema.post.body.
     * Pass the schema type as a generic for compile-time inference:
     *   this.parseBody<typeof MyService.zodSchema.post.body>(request)
     * @param request The http request passed in to the system
     * @returns The validated body data
     */
    parseBody<S = any>(request: Request): ZodInfer<S>;
    /**
     * @public parseOutput
     * @description Parse and validate response output against the Zod schema defined in zodSchema.post.response.
     * Pass the response schema type as a generic for compile-time inference:
     *   this.parseOutput<typeof MyService.zodSchema.post.response[200]['schema']>(data)
     * @param data The response data to send out in a response
     * @param statusCode The HTTP status code to select the response schema (defaults to 200)
     * @returns The validated output data
     */
    parseOutput<S = any>(data: any, statusCode?: number): ZodInfer<S>;
}
//# sourceMappingURL=ServiceZod.d.ts.map