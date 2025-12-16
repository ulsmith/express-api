import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
/**
 * @module express-api/Service/Dynamo
 * @class Dynamo
 * @description Service class providing DynamoDB connection
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 * @example
 * new Dynamo('192.168.1.10', 8000, 'your_db', 'your_key', 'your_secret', 'us-east-1');
 */
export default class Dynamo {
    dynamo: DynamoDBClient;
    client: DynamoDBDocumentClient;
    name: string;
    service: string;
    host: string;
    port: number;
    db: string;
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     */
    constructor(host: string, port: number, db: string, key: string, secret: string, region: string);
}
//# sourceMappingURL=Dynamo.d.ts.map