import { jest } from '@jest/globals';
import Dynamo from '../../Service/Dynamo';

describe('Dynamo', () => {
	describe('constructor', () => {
		it('should set all properties correctly', () => {
			const dynamo = new Dynamo('localhost', 8000, 'testdb', 'key', 'secret', 'us-east-1');

			expect(dynamo.name).toBe('dynamo');
			expect(dynamo.service).toBe('dynamo:testdb');
			expect(dynamo.host).toBe('localhost');
			expect(dynamo.port).toBe(8000);
			expect(dynamo.db).toBe('testdb');
		});

		it('should create DynamoDBClient and DynamoDBDocumentClient instances', () => {
			const dynamo = new Dynamo('localhost', 8000, 'testdb', 'key', 'secret', 'us-east-1');

			expect(dynamo.dynamo).toBeDefined();
			expect(dynamo.client).toBeDefined();
		});

		it('should handle different regions', () => {
			const dynamo = new Dynamo('localhost', 8000, 'testdb', 'key', 'secret', 'eu-west-1');

			expect(dynamo.name).toBe('dynamo');
			expect(dynamo.service).toBe('dynamo:testdb');
		});

		it('should handle different hosts and ports', () => {
			const dynamo = new Dynamo('192.168.1.10', 9000, 'mydb', 'mykey', 'mysecret', 'us-west-2');

			expect(dynamo.host).toBe('192.168.1.10');
			expect(dynamo.port).toBe(9000);
			expect(dynamo.db).toBe('mydb');
		});
	});
});
