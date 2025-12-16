import Controller from '../Controller.js';
import RestError from '../../Error/Rest.js';
import SchemaTools from '../../Library/SchemaTools.js';
var SchemaMethods;
(function (SchemaMethods) {
    SchemaMethods["get"] = "get";
    SchemaMethods["post"] = "post";
    SchemaMethods["put"] = "put";
    SchemaMethods["patch"] = "patch";
    SchemaMethods["delete"] = "delete";
})(SchemaMethods || (SchemaMethods = {}));
/**
 * @module express-api/Base/Controller/Api
 * @class Api
 * @extends Controller
 * @description Base class to give an extension to system base class for creating API controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Api extends Controller {
    /**
     * @public parseBody
     * @description Parse the body of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns the resulting body data
     */
    parseBody(request, method) {
        try {
            const m = method || this.getCallingMethod();
            return SchemaTools.parseBody(request, this.options()[m], `${this.constructor.name}:${m}:${this.options()[m]?.description || ''}`);
        }
        catch (err) {
            throw new RestError(err.message, 400);
        }
    }
    /**
     * @public parsePathParameters
     * @description Parse the path parameters of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns The resulting parameter data
     */
    parsePathParameters(request, method) {
        try {
            const m = method || this.getCallingMethod();
            return SchemaTools.parsePathParameters(request, this.options()[m], `${this.constructor.name}:${m}:${this.options()[m]?.description || ''}`);
        }
        catch (err) {
            throw new RestError(err.message, 400);
        }
    }
    /**
     * @public parseQueryParameters
     * @description Parse the query parameters of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param method The optional method to use if auto detection fails
     * @returns The resulting parameter data
     */
    parseQueryParameters(request, method) {
        try {
            const m = method || this.getCallingMethod();
            return SchemaTools.parseQueryParameters(request, this.options()[m], `${this.constructor.name}:${m}:${this.options()[m]?.description || ''}`);
        }
        catch (err) {
            throw new RestError(err.message, 400);
        }
    }
    /**
     * @public parseOutput
     * @description Parse the response output, based on the schemaMethod passed in to remove data, require it and type check etc
     * @param data The response data to send out in a response
     * @param method The optional method to use if auto detection fails
     * @returns the resulting body data
     */
    parseOutput(data, method) {
        try {
            const m = method || this.getCallingMethod();
            return SchemaTools.parseOutput(data, this.options()[m], `${this.constructor.name}:${m}:${this.options()[m]?.description || ''}`);
        }
        catch (err) {
            throw new RestError(err.message, 400);
        }
    }
    /**
     * @protected getCallingMethod
     * @description Attempts to detect the calling method name from the call stack
     * @returns The detected method name or undefined if not found
     */
    getCallingMethod() {
        try {
            const stack = new Error().stack;
            if (!stack)
                throw new Error('not found');
            const stackLines = stack.split('\n');
            for (let i = 2; i < Math.min(stackLines.length, 6); i++) {
                const line = stackLines[i];
                const methods = ['get', 'post', 'put', 'patch', 'delete'];
                for (const method of methods)
                    if (line.includes(`.${method}`) || line.includes(`.${method}(`))
                        return method;
            }
        }
        catch { }
        throw new Error('Could not determine HTTP method. Please provide method parameter or ensure parseOutput is called from a method named get, post, put, patch, or delete.');
    }
}
//# sourceMappingURL=Api.js.map