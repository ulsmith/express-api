import Core from '../../System/Core.js';
import { GlobalsType } from '../../Types/System.js';
/**
 * @module express-api/Base/Model/Dynamo
 * @class ModelDynamo
 * @extends Core
 * @description System class to give a base for creating DynamoDB models
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ModelDynamo<T extends GlobalsType> extends Core<T> {
    dbname: string;
    params: {
        TableName: string;
        KeySchema: Array<{
            AttributeName: string;
            KeyType: 'HASH' | 'RANGE';
        }>;
        AttributeDefinitions: Array<{
            AttributeName: string;
            AttributeType: 'S' | 'N' | 'B';
        }>;
        ProvisionedThroughput: {
            ReadCapacityUnits: number;
            WriteCapacityUnits: number;
        };
        [key: string]: any;
    };
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     */
    constructor(globals: T, dbname: string, table: string, params?: any);
    /**
     * @public @get dynamo
     * @desciption Get the services available to the system
     * @return {any} Dynamo service
     */
    get dynamo(): any;
    /**
     * @public @get db
     * @desciption Get the services available to the system
     * @return {any} DynamoDB client
     */
    get db(): any;
    /**
     * @public @method create
     * @description Create a new table resource
     * @return {Promise} a resulting promise of data or error on failure
     * @example
     * let dynamoSource = new DynamoSourceModel();
     * return dynamoSource.createTable();
     */
    createTable(): Promise<any>;
    /**
     * @public @method get
     * @description Get a single resource in a single table by table id
     * @param {Mixed} key The key to the resource as a literal string/number (mapping to one key schema) or an object as Keys matching key schema ({ id: 123456, something: 'else' })
     * @return {Promise} a resulting promise of data or error on failure
     * @example
     * let dynamoSource = new DynamoSourceModel();
     * return dynamoSource.get('6ff98823-3c0b-4b09-a433-63fc55cfa6d0');
     */
    get(key: any): Promise<any>;
    /**
     * @public @method put
     * @description Put a single resource into dynamo table
     * @param {Object} item The data to put into the resource
     * @return {Promise} a resulting promise of data or error on failure
     * @example
     * let dynamoSource = new DynamoSourceModel();
     * return dynamoSource.put({
     *		id: '6ff98823-3c0b-4b09-a433-63fc55cfa6d0',
     *		product: [
     * 			{
     * 				title: 'Title Two',
     * 				description: 'Description two... more stuff'
     * 			}
     * 		],
     * 		filter: {
     * 			z: 'zzz'
     * 		}
     * });
     */
    put(item: any): Promise<any>;
    /**
     * @public @method update
     * @description Update a single resource in dynamo table
     * @param {Mixed} key The key to the resource as a literal string/number (mapping to one key schema) or an object as Keys matching key schema ({ id: 123456, something: 'else' })
     * @param {Object} item The data to update in the resource { "some.path.to.property": "new value" }
     * @return {Promise} a resulting promise of data or error on failure
     * @example
     * let dynamoSource = new DynamoSourceModel();
     * return dynamoSource.update('9ff98823-3c0b-4b09-a433-63fc55cfa6d0', {
     *		product: [
     * 			{
     * 				title: 'Title Two',
     * 				description: 'Description two... more stuff'
     * 			}
     * 		]
     * });
     */
    update(key: any, item: any): Promise<any>;
    /**
     * @public @method listAppend
     * @description Append item to a property list in dynamo table
     * @param {Mixed} key The key to the resource as a literal string/number (mapping to one key schema) or an object as Keys matching key schema ({ id: 123456, something: 'else' })
     * @param {Mixed} item The data to append in the resource { "some.path.to.property": "new value" }
     * @return {Promise} a resulting promise of data or error on failure
     * @example
     * let dynamoSource = new DynamoSourceModel();
     * return dynamoSource.listAppend('9ff98823-3c0b-4b09-a433-63fc55cfa6d0', {
     *		product: [
     * 			{
     * 				title: 'Title Two',
     * 				description: 'Description two... more stuff'
     * 			}
     * 		]
     * });
     */
    listAppend(key: any, item: any): Promise<any>;
}
//# sourceMappingURL=Dynamo.d.ts.map