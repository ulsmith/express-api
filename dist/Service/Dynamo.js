// @ts-ignore - Optional peer dependency
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// @ts-ignore - Optional peer dependency
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
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     */
    constructor(host, port, db, key, secret, region) {
        // create dynamo client
        this.dynamo = new DynamoDBClient({
            region: region,
            credentials: {
                accessKeyId: key,
                secretAccessKey: secret
            },
            endpoint: `http://${host}:${port}`
        });
        // create document client
        this.client = DynamoDBDocumentClient.from(this.dynamo);
        this.name = 'dynamo';
        this.service = 'dynamo:' + db;
        this.host = host;
        this.port = port;
        this.db = db;
    }
}
//# sourceMappingURL=Dynamo.js.map