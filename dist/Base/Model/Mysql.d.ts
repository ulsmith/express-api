import Core from '../../System/Core.js';
import { GlobalsType } from '../../Types/System.js';
/**
 * @module express-api/Base/Model/Mysql
 * @class ModelMysql
 * @extends Core
 * @description System class to give a base for creating MySQL models, exposing the knex DB service and giving base methods
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ModelMysql<T extends GlobalsType> extends Core<T> {
    dbname: string;
    table: string;
    softDelete?: boolean;
    idCol: string;
    createdCol: string;
    updatedCol: string;
    deleteCol: string;
    columns?: {
        [key: string]: any;
    };
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     */
    constructor(globals: T, dbname: string, table: string, params?: {
        softDelete?: boolean;
        idCol?: string;
        createdCol?: string;
        updatedCol?: string;
        deleteCol?: string;
    });
    /**
     * @public @get db
     * @desciption Get the services available to the system
     * @return {any} MySQL connection
     */
    get db(): any;
    /**
     * @public notSoftDeleted
     * @desciption Get insertable for soft delete check
     * @return {String} The query insertable for checking soft delete, if set
     */
    notSoftDeleted(prefix: string): string;
    /**
     * @public @method get
     * @description Get a single resource in a single table by table id
     * @param {Number} id The resource id to get
     * @return {Promise} a resulting promise of data or error on failure
     */
    get(id: any): Promise<any>;
    /**
     * @public @method find
     * @description Find one or more resources from a where object in a single table
     * @param {Object} where The where object as key value, or knex style where object
     * @return {Promise} a resulting promise of data or error on failure
     */
    find(where: any): Promise<any>;
    /**
     * @public @method first
     * @description Find one or more resources from a where object in a single table
     * @param {Object} where The where object as key value, or knex style where object
     * @return {Promise} a resulting promise of data or error on failure
     */
    first(where?: any): Promise<any>;
    /**
     * @public @method last
     * @description Find one or more resources from a where object in a single table
     * @param {Object} where The where object as key value, or knex style where object
     * @return {Promise} a resulting promise of data or error on failure
     */
    last(where?: any): Promise<any>;
    /**
     * @public @method all
     * @description all resources from a single table
     * @return {Promise} a resulting promise of data or error on failure
     */
    all(): Promise<any>;
    /**
     * @public @method insert
     * @description Insert single/many resource/s in a single table, clear any default data (id, created, updated)
     * @param {Array[Object]|Object} data The object data to insert into the resource as {key: value}
     * @param {Mixed} returning The array of returned columns or a string
     * @return {Promise} a resulting promise of data or error on failure
     */
    insert(data: any, returning?: any): Promise<any>;
    /**
     * @public @method update
     * @description Update a single resource in a single table by table id, clear any default data (id, created, updated)
     * @param {Mixed} where The resource id to update or an object of where data
     * @param {Object} data The object data to update on the resource as {key: value}
     * @return {Promise} a resulting promise of data or error on failure
     */
    update(where: any, data: any): Promise<any>;
    /**
     * @public @method delete
     * @description Delete a single resource in a single table by table id
     * @param {Number} id The resource id to delete
     * @return {Promise} a resulting promise of data or error on failure
     */
    delete(id: any, type?: string): Promise<any>;
    /**
     * @public @method restore
     * @description Soft restore a single resource (undelete) in a single table that has been soft deleted
     * @param {Number} id The resource id to soft restore
     * @return {Promise} a resulting promise of data or error on failure
     */
    restore(id: any): Promise<any>;
    /**
     * @public @method queryWhere
     * @description Builds an SQL query snippit to add on to a query, from an object including where property or simple key values matching table names
     * @param {Object} args Arguments to work through
     * @param {Array} values Values object pointer to fill with values as they are created for binding to be used in execution
     * @param {String} chain The chain type to join on with or default to 'WHERE' for no chain
     * @return {String} The SQL snippit to add to SQL query
     * @example
     * SIMPLE QUERY (as AND)
     *  { id: '12345', name: 'test' }
     *
     * COMPLEX QUERY (nested and various types)
     * 	{
     *		"where": [
     *			{ "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" },
     *			{ "chain": "AND", "key": "id", "condition": "IN", "value": ["00231a73a9981d63b0f11a789a46ccb1"] },
     *			{ "chain": "AND", "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" },
     *			{
     *				"chain": "OR",
     *				"where": [
     *					{ "key": "id", "condition": "IS", "value": null },
     *					{ "chain": "OR", "key": "id", "condition": "NOT", "value": "abc123" },
     *					{ "chain": "OR", "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" }
     *				]
     *			}
     *		]
     *	}
     */
    queryWhere(args: any, values: any[], chain?: string): string;
    /**
     * @public @method queryOrder
     * @description Builds a query snippit to add on to a query string adding ORDER BY from arguments passed in
     * @param {Object} args Arguments to work through as the whole argument list containing the order/orderBy as a property
     * @return {String} The snippit to add to query as SQL snippet
     * @example
     * {
     *    order/orderBy: [
     *        { key: "reference", direction: "ASC" },
     *        { key: "id", direction: "ASC" }
     *    ]
     * }
     *
     */
    queryOrder(args: any): string;
    /**
     * @public @method queryLimit
     * @description Builds a query snippit to add on to a query string adding LIMIT from arguments passed in
     * @param {Object} args Arguments to work through as a whole argument list containing the limit as a property
     * @return {String} The snippit to add to query as SQL snippet
     * @example
     *   {
     *    	limit: 10
     *   }
     */
    queryLimit(args: any): string;
    /**
     * @public @method queryOffset
     * @description Builds a query snippit to add on to a query string adding OFFSET from arguments passed in
     * @param {Object} args Arguments to work through as a whole argument list containing the offset as a property
     * @return {String} The snippit to add to query as SQL snippet
     * @example
     *   {
     *    	offset: 10
     *   }
     */
    queryOffset(args: any): string;
    /**
     * @public @method arrayWhere
     * @description Builds an array filter to apply where style query to JSON arrays returned from a query, including where property or simple key values matching table names
     * @param {Object} args Arguments to work through
     * @param {Array} items Array of the items to filter with SQL where style filtering
     * @return {Array} The filtered array of items
     * @example
     * SIMPLE QUERY (as AND)
     *  { id: '12345', name: 'test' }
     *
     * COMPLEX QUERY (nested and various types)
     * 	{
     *		"where": [
     *			{ "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" },
     *			{ "chain": "AND", "key": "id", "condition": "IN", "value": ["00231a73a9981d63b0f11a789a46ccb1"] },
     *			{ "chain": "AND", "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" },
     *			{
     *				"chain": "OR",
     *				"where": [
     *					{ "key": "id", "condition": "IS", "value": null },
     *					{ "chain": "OR", "key": "id", "condition": "NOT", "value": "abc123" },
     *					{ "chain": "OR", "key": "id", "condition": "EQUALS", "value": "00231a73a9981d63b0f11a789a46ccb1" }
     *				]
     *			}
     *		]
     *	}
     */
    arrayWhere(args: any, items: any[]): any[];
    /**
     * @public @method arrayOrder
     * @description Builds a sorter snippit to sort an array of items in an SQL style 'order by' way
     * @param {Object} args Arguments to work through as the whole argument list containing the order/orderBy as a property
     * @param {Array} items Array of the items to filter with SQL where style filtering
     * @return {Array} The filtered array of items
     * @example
     * {
     *    order/orderBy: [
     *        { key: "reference", direction: "ASC" },
     *        { key: "id", direction: "ASC" }
     *    ]
     * }
     *
     */
    arrayOrder(args: any, items: any[]): any[];
    /**
     * @public @method arrayLimit
     * @description Builds a splicer to splice 'limit' amount of records from an array in an SQL style way
     * @param {Object} args Arguments to work through as a whole argument list containing the limit as a property
     * @param {Array} items Array of the items to filter with SQL where style filtering
     * @return {Array} The filtered array of items
     * @example
     *   {
     *    	limit: 10
     *   }
     */
    arrayLimit(args: any, items: any[]): any[];
    /**
     * @public @method arrayOffset
     * @description Builds a splicer to splice array from 'offset' from an array in an SQL style way
     * @param {Object} args Arguments to work through as a whole argument list containing the limit as a property
     * @param {Array} items Array of the items to filter with SQL where style filtering
     * @example
     *   {
     *    	offset: 10
     *   }
     */
    arrayOffset(args: any, items: any[]): any[];
    /**
     * @public @method mapDataToColumn
     * @description Map all incoming data, to columns to make sure we have a full dataset, or send partial flag true to map only partial dataset
     * @param {Object} data The data to check against the columns
     * @param {Boolean} partial The flag to force a partial map on only data available in dataset
     * @return {Object} a resulting promise of data or error on failure
     */
    mapDataToColumn(data: any, partial?: boolean): any;
    /**
     * @public @method mapDataArrayToColumn
     * @description Map all incoming data array of data, to columns to make sure we have a full dataset, or send partial flag true to map only partial dataset
     * @param {Array} data The data to check against the columns
     * @param {Boolean} partial The flag to force a partial map on only data available in dataset
     * @return {Array} a resulting promise of data or error on failure
     */
    mapDataArrayToColumn(data: any, partial?: boolean): any;
    /**
     * @public @method parseError
     * @description Parse the error code from teh database to see if we can show it, else generic message
     * @param {Error} error The error object
     * @return {Object} with parsed error data in fo rthe end user
     */
    parseError(error: any): any;
    /**
     * @public @method checkColumnsStrict
     * @description Check columns against dataset, ensure required are present too
     * @param {Object} data The data to check against the columns
     * @return {Promise} a resulting promise of data or error on failure
     */
    checkColumnsStrict(data: any): boolean;
    /**
     * @public @method inject
     * @description Prepares text to inject into SQL directly for column names and such removing bad chars, quoting non * refs. WARNING! only inject variables for column names etc, NOT data!
     * @param {String} text The string to inject into SQL that needs cleaning
     * @return {String} a cleaned string
     */
    inject(text: string): string;
    /**
     * @private @method __cleanIncommingData
     * @description Clean any incomming data free of default values set by the DB directly
     * @param {Mixed} data The resource data to clean or array of data
     * @param {Bool} skipId Should we skip ID
     * @return {Mixed} The cleaned data object or array of objects
     */
    __cleanIncommingData(data: any, skipId?: boolean): any;
    /**
     * @private @method __parseQueryWhere
     * @description Recursive where clause parser, building nested where SQL strings from objects
     * @param {Object} args The data to use for where building as a nested where object
     * @param {Array} values The values to bind to as a pointer so they can be passed in to SQL execution
     * @return {String} The where portion of the SQL string as the whole or recursive part
     */
    __parseQueryWhere(args: any, values: any[]): string;
    /**
     * @private @method __parseArrayWhere
     * @description Recursive where clause parser, filtering arrays of object in an SQL way
     * @param {Object} args The data to use for where building as a nested where object
     * @param {Array} items Array of the items to filter with SQL where style filtering
     * @return {Array} The filtered array of items
     */
    __parseArrayWhere(args: any, items: any[]): any[];
    /**
     * @private @method __parseValue
     * @description Parser for values to pull them from many typed or generic property names casting to types
     * @param {Object} val The value sent in as an object with a typeed property such as { boolean: true, string: 'test', number: 1, date: '2018-01-01', value: 'anything' }
     * @param {Array} values The values to bind to as a pointer
     * @return {String} The where portion of the clause
     */
    __parseValue(val: any): any;
    /**
     * @private @method __parseCondition
     * @description Parser for condition used in comparison logic, changing into SQL string
     * @param {String} con The condition string to be changed to SQL string
     * @return {String} The condition as SQL string
     */
    __parseCondition(con: any): string;
    /**
     * @private @method __parseChain
     * @description Parser for the chain used in chaining arguments such as AND or OR changing to SQL format
     * @param {String} chn The chain string to be changed to SQL string
     * @return {String} The SQL string used to chain arguments
     */
    __parseChain(chn: any): string;
    /**
     * @private @method __parseDirection
     * @description Parser for standardising incomming data to SQL equivelent
     * @param {String} dir The direction as a string in several ways
     * @return {String} The SQL standard sting
     */
    __parseDirection(dir: any): string;
}
//# sourceMappingURL=Mysql.d.ts.map