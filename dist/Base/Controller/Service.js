import Controller from '../Controller.js';
import RestError from '../../Error/Rest.js';
import SchemaTools from '../../Library/SchemaTools.js';
var SchemaMethods;
(function (SchemaMethods) {
    SchemaMethods["post"] = "post";
})(SchemaMethods || (SchemaMethods = {}));
/**
 * @module express-api/Base/Controller/Service
 * @class Service
 * @extends Controller
 * @description Base class to give an extension to system base class for creating service controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Service extends Controller {
    /**
     * @public parseBody
     * @description Parse the body of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @returns the resulting body data
     */
    parseBody(request) {
        try {
            return SchemaTools.parseBody(request, this.options().post, `${this.constructor.name}:post:${this.options().post?.description || ''}`);
        }
        catch (err) {
            throw new RestError(err.message, 400);
        }
    }
    /**
     * @public parseOutput
     * @description Parse the response output, based on the schemaMethod passed in to remove data, require it and type check etc
     * @param data The response data to send out in a response
     * @returns the resulting body data
     */
    parseOutput(data) {
        try {
            return SchemaTools.parseOutput(data, this.options().post, `${this.constructor.name}:post:${this.options().post?.description || ''}`);
        }
        catch (err) {
            throw new RestError(err.message, 400);
        }
    }
}
//# sourceMappingURL=Service.js.map