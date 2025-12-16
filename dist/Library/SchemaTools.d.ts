import { SwaggerSchemaMethodType } from '../Types/Swagger.js';
import Request from '../System/Request.js';
/**
 * @module express-api/Library/SchemaTools
 * @class SchemaTools
 * @description Utility class providing schema parsing and validation functionality
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class SchemaTools {
    /**
     * @public @static parseBody
     * @description Parse the body of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param schemaBlock The specific schema block from the controller schema to parse against
     * @returns the resulting body data
     */
    static parseBody<T = any>(request: Request, schemaBlock?: SwaggerSchemaMethodType, debugMessage?: string): T;
    /**
     * @public @static parsePathParameters
     * @description Parse the path parameters of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param schemaBlock The specific schema block from the controller schema to parse against
     * @returns The resulting parameter data
     */
    static parsePathParameters<T = any>(request: Request, schemaBlock?: SwaggerSchemaMethodType, debugMessage?: string): T;
    /**
     * @public @static parseQueryParameters
     * @description Parse the query parameters of a request, based on the schemaMethod passed in
     * @param request The http request passed in to the system
     * @param schemaBlock The specific schema block from the controller schema to parse against
     * @returns The resulting parameter data
     */
    static parseQueryParameters<T = any>(request: Request, schemaBlock?: SwaggerSchemaMethodType, debugMessage?: string): T;
    /**
     * @public @static parseOutput
     * @description Parse the response output, based on the schemaMethod passed in to remove data, require it and type check etc
     * @param data The response data to send out in a response
     * @param schemaBlock The specific schema block from the controller schema to parse against
     * @returns the resulting body data
     */
    static parseOutput<T = any>(data: any, schemaBlock?: SwaggerSchemaMethodType, debugMessage?: string): T;
    /**
     * @private static __check
     * @description Check parameter type against schema
     * @param schemaParam The schema param to check data against
     * @param data The data to check
     * @param key The key of the data we are checking
     * @param required Is the data required or optional
     * @returns The schema param data
     */
    private static __check;
    /**
     * @private @static __checkUnion
     * @description Check union type parameter (type as array)
     * @param schemaParam The schema union param to check data against
     * @param data The data to check
     * @param ignore Whether to ignore errors and return undefined
     * @param key The key of the data we are checking
     * @param required Is the data required or optional
     * @param parentSchema The parent schema for context
     * @returns The validated data
     */
    private static __checkUnion;
    /**
     * @private @static __checkOneOf
     * @description Check oneOf parameter (multiple possible schemas)
     * @param schemaParam The schema oneOf param to check data against
     * @param data The data to check
     * @param ignore Whether to ignore errors and return undefined
     * @param key The key of the data we are checking
     * @param required Is the data required or optional
     * @param parentSchema The parent schema for context
     * @returns The validated data
     */
    private static __checkOneOf;
    /**
     * @private @static __checkString
     * @description Check string parameter type
     * @param schemaParam The schema string param to check data against
     * @param data The data to check
     * @param key The key of the data we are checking
     * @param required Is the data required or optional
     * @returns The schema string param data
     */
    private static __checkString;
    /**
     * @private @static __checkNumber
     * @description Check number parameter type
     * @param schemaParam The schema number param to check data against
     * @param data The data to check
     * @param key The key of the data we are checking
     * @param required Is the data required or optional
     * @returns The schema number param data
     */
    private static __checkNumber;
    /**
     * @private @static __checkBoolean
     * @description Check boolean parameter type
     * @param schemaParam The schema boolean param to check data against
     * @param data The data to check
     * @param key The key of the data we are checking
     * @param required Is the data required or optional
     * @returns The boolean string param data
     */
    private static __checkBoolean;
    /**
     * @private @static __checkArray
     * @description Check array parameter type
     * @param schemaParam The schema array param to check data against
     * @param data The data to check
     * @param key The key of the data we are checking
     * @param required Is the data required or optional
     * @returns The schema array param data
     */
    private static __checkArray;
    /**
     * @private @static __checkObject
     * @description Check object parameter type
     * @param schemaParam The schema object param to check data against
     * @param data The data to check
     * @param key The key of the data we are checking
     * @param required Is the data required or optional
     * @returns The object string param data
     */
    private static __checkObject;
    /**
     * @private @static __getTypeName
     * @description Get the actual type name of a value, properly identifying arrays
     * @param data The data to get the type of
     * @returns The type name (e.g., 'string', 'number', 'array', 'object', 'boolean', 'null')
     */
    private static __getTypeName;
}
//# sourceMappingURL=SchemaTools.d.ts.map