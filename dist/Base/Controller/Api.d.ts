import Controller from '../Controller.js';
import Request from '../../System/Request.js';
import { SwaggerSchemaMethodType } from '../../Types/Swagger.js';
import { GlobalsType } from '../../Types/System.js';
declare enum SchemaMethods {
    get = "get",
    post = "post",
    put = "put",
    patch = "patch",
    delete = "delete"
}
export type Schema = {
    [key in SchemaMethods]?: SwaggerSchemaMethodType;
};
/**
 * @module express-api/Base/Controller/Api
 * @class Api
 * @extends Controller
 * @description Base class to give an extension to system base class for creating API controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default abstract class Api<T extends GlobalsType> extends Controller<T> {
    /**
     * @public @method options
     * @description Return metadata documentation on the endpoint
     * @returns The documentation for this endpoint
     */
    abstract options(): Schema;
    /**
     * @public parseBody
     * @description Parse the body of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns the resulting body data
     */
    parseBody<T = any>(request: Request, method?: 'get' | 'post' | 'put' | 'patch' | 'delete'): T;
    /**
     * @public parsePathParameters
     * @description Parse the path parameters of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns The resulting parameter data
     */
    parsePathParameters<T = any>(request: Request, method?: 'get' | 'post' | 'put' | 'patch' | 'delete'): T;
    /**
     * @public parseQueryParameters
     * @description Parse the query parameters of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns The resulting parameter data
     */
    parseQueryParameters<T = any>(request: Request, method?: 'get' | 'post' | 'put' | 'patch' | 'delete'): T;
    /**
     * @public parseOutput
     * @description Parse the response output, based on the schemaMethod passed in to remove data, require it and type check etc
     * @param data The response data to send out in a response
     * @param method The optional method to use if auto detection fails
     * @returns the resulting body data
     */
    parseOutput<T = any>(data: any, method?: 'get' | 'post' | 'put' | 'patch' | 'delete'): T;
    /**
     * @protected getCallingMethod
     * @description Attempts to detect the calling method name from the call stack
     * @returns The detected method name or undefined if not found
     */
    protected getCallingMethod(): 'get' | 'post' | 'put' | 'patch' | 'delete';
}
export {};
//# sourceMappingURL=Api.d.ts.map