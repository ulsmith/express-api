import Core from '../../System/Core.js';
import ModelError from '../../Error/Model.js';
// @ts-ignore - Optional peer dependency
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
// @ts-ignore - Optional peer dependency
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
/**
 * @module express-api/Base/Model/Dynamo
 * @class ModelDynamo
 * @extends Core
 * @description System class to give a base for creating DynamoDB models
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class ModelDynamo extends Core {
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     */
    constructor(globals, dbname, table, params) {
        super(globals);
        if (!table)
            throw new ModelError('table is required in params for dynamo db connection');
        this.dbname = dbname;
        this.params = { ...{
                TableName: table,
                KeySchema: [
                    {
                        AttributeName: "id",
                        KeyType: "HASH"
                    }
                ],
                AttributeDefinitions: [
                    {
                        AttributeName: "id",
                        AttributeType: "S"
                    }
                ],
                ProvisionedThroughput: {
                    ReadCapacityUnits: 10,
                    WriteCapacityUnits: 10
                }
            }, ...(params || {}) };
    }
    /**
     * @public @get dynamo
     * @desciption Get the services available to the system
     * @return {any} Dynamo service
     */
    get dynamo() { return this.$services['dynamo:' + this.dbname].dynamo; }
    /**
     * @public @get db
     * @desciption Get the services available to the system
     * @return {any} DynamoDB client
     */
    get db() { return this.$services['dynamo:' + this.dbname].client; }
    /**
     * @public @method create
     * @description Create a new table resource
     * @return {Promise} a resulting promise of data or error on failure
     * @example
     * let dynamoSource = new DynamoSourceModel();
     * return dynamoSource.createTable();
     */
    async createTable() {
        const command = new CreateTableCommand(this.params);
        return this.dynamo.send(command);
    }
    /**
     * @public @method get
     * @description Get a single resource in a single table by table id
     * @param {Mixed} key The key to the resource as a literal string/number (mapping to one key schema) or an object as Keys matching key schema ({ id: 123456, something: 'else' })
     * @return {Promise} a resulting promise of data or error on failure
     * @example
     * let dynamoSource = new DynamoSourceModel();
     * return dynamoSource.get('6ff98823-3c0b-4b09-a433-63fc55cfa6d0');
     */
    async get(key) {
        const command = new GetCommand({
            TableName: this.params.TableName,
            Key: typeof key !== 'object' ? { [this.params.KeySchema[0].AttributeName]: key } : key
        });
        const result = await this.db.send(command);
        return result;
    }
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
    async put(item) {
        const command = new PutCommand({
            TableName: this.params.TableName,
            Item: item,
            ReturnValues: "ALL_OLD"
        });
        await this.db.send(command);
        return item;
    }
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
    async update(key, item) {
        // map data to update
        let iKeys = Object.keys(item);
        let uExp = 'SET ' + iKeys.map((k, i) => `#${i} = :${i}`).join(', ');
        let eNames = iKeys.reduce((p, c, i) => ({ ...p, [`#${i}`]: c }), {});
        let eValues = iKeys.reduce((p, c, i) => ({ ...p, [`:${i}`]: item[c] }), {});
        const command = new UpdateCommand({
            TableName: this.params.TableName,
            Key: typeof key !== 'object' ? { [this.params.KeySchema[0].AttributeName]: key } : key,
            UpdateExpression: uExp,
            ExpressionAttributeNames: eNames,
            ExpressionAttributeValues: eValues,
            ReturnValues: "ALL_NEW"
        });
        const result = await this.db.send(command);
        return result;
    }
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
    async listAppend(key, item) {
        // map data to update
        let iKeys = Object.keys(item);
        let uExp = 'SET ' + iKeys.map((k, i) => `#${i} = list_append(#${i}, :${i})`).join(', ');
        let eNames = iKeys.reduce((p, c, i) => ({ ...p, [`#${i}`]: c }), {});
        let eValues = iKeys.reduce((p, c, i) => ({ ...p, [`:${i}`]: item[c] }), {});
        const command = new UpdateCommand({
            TableName: this.params.TableName,
            Key: typeof key !== 'object' ? { [this.params.KeySchema[0].AttributeName]: key } : key,
            UpdateExpression: uExp,
            ExpressionAttributeNames: eNames,
            ExpressionAttributeValues: eValues,
            ReturnValues: "ALL_NEW"
        });
        const result = await this.db.send(command);
        return result;
    }
}
//# sourceMappingURL=Dynamo.js.map