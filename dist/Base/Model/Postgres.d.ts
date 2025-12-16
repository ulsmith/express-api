import Core from '../../System/Core.js';
import { GlobalsType } from '../../Types/System.js';
/**
 * @module express-api/Base/Model/Postgres
 * @class ModelPG
 * @extends Core
 * @description System class to give a base for creating PostgreSQL models, exposing the knex DB service and giving base methods
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ModelPG<T extends GlobalsType> extends Core<T> {
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
     * @desciption Get the services available to the system via the database
     * @return {Client} The PG Client via node-pg
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
     * @param {Mixed} returning The array of returned columns or a string
     * @return {Promise} a resulting promise of data or error on failure
     */
    update(where: any, data: any, returning?: any): Promise<any>;
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
}
//# sourceMappingURL=Postgres.d.ts.map