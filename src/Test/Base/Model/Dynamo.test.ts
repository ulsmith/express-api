import { jest } from '@jest/globals';
import ModelDynamo from '../../../Base/Model/Dynamo';
import Core from '../../../System/Core';
import ModelError from '../../../Error/Model';
import { GlobalsType } from '../../../Types/System';
// @ts-ignore - Optional peer dependency
import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
// @ts-ignore - Optional peer dependency
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

// Mock DynamoDB client and service
const mockDynamoSend = jest.fn<(command: any) => Promise<any>>();
const mockClientSend = jest.fn<(command: any) => Promise<any>>();

const createMockGlobals = (): GlobalsType => ({
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {
		'dynamo:testdb': {
			dynamo: {
				send: mockDynamoSend
			},
			client: {
				send: mockClientSend
			}
		}
	},
	$socket: {} as any,
	$io: {} as any,
});

// Create a concrete implementation for testing
class TestDynamoModel extends ModelDynamo<GlobalsType> {
	constructor(globals: GlobalsType, dbname: string = 'testdb', table: string = 'test_table', params?: any) {
		super(globals, dbname, table, params);
	}
}

describe('ModelDynamo', () => {
	let mockGlobals: GlobalsType;

	beforeEach(() => {
		mockGlobals = createMockGlobals();
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should extend Core', () => {
			const model = new TestDynamoModel(mockGlobals);
			expect(model).toBeInstanceOf(Core);
			expect(model).toBeInstanceOf(ModelDynamo);
		});

		it('should throw ModelError when table is not provided', () => {
			expect(() => {
				new TestDynamoModel(mockGlobals, 'testdb', '');
			}).toThrow(ModelError);
			expect(() => {
				new TestDynamoModel(mockGlobals, 'testdb', '');
			}).toThrow('table is required in params for dynamo db connection');
		});

		it('should set default params when not provided', () => {
			const model = new TestDynamoModel(mockGlobals);
			
			expect(model.dbname).toBe('testdb');
			expect(model.params.TableName).toBe('test_table');
			expect(model.params.KeySchema).toEqual([{ AttributeName: 'id', KeyType: 'HASH' }]);
			expect(model.params.AttributeDefinitions).toEqual([{ AttributeName: 'id', AttributeType: 'S' }]);
			expect(model.params.ProvisionedThroughput).toEqual({ ReadCapacityUnits: 10, WriteCapacityUnits: 10 });
		});

		it('should merge custom params with defaults', () => {
			const customParams = {
				KeySchema: [{ AttributeName: 'customId', KeyType: 'HASH' }],
				ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
			};
			const model = new TestDynamoModel(mockGlobals, 'testdb', 'test_table', customParams);
			
			expect(model.params.KeySchema).toEqual([{ AttributeName: 'customId', KeyType: 'HASH' }]);
			expect(model.params.ProvisionedThroughput).toEqual({ ReadCapacityUnits: 5, WriteCapacityUnits: 5 });
		});
	});

	describe('getters', () => {
		it('should return dynamo service via dynamo getter', () => {
			const model = new TestDynamoModel(mockGlobals);
			expect(model.dynamo).toBe((mockGlobals.$services as any)['dynamo:testdb'].dynamo);
		});

		it('should return db client via db getter', () => {
			const model = new TestDynamoModel(mockGlobals);
			expect(model.db).toBe((mockGlobals.$services as any)['dynamo:testdb'].client);
		});
	});

	describe('createTable', () => {
		it('should call dynamo createTable with params', async () => {
			const model = new TestDynamoModel(mockGlobals);
			mockDynamoSend.mockResolvedValue({ TableDescription: { TableName: 'test_table' } });

			const result = await model.createTable();
			
			expect(mockDynamoSend).toHaveBeenCalledWith(expect.any(CreateTableCommand));
			expect(mockDynamoSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockDynamoSend.mock.calls[0]?.[0]?.input).toEqual(model.params);
			expect(result).toEqual({ TableDescription: { TableName: 'test_table' } });
		});

		it('should reject on error', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const error = new Error('CreateTable failed');
			mockDynamoSend.mockRejectedValue(error);

			await expect(model.createTable()).rejects.toThrow('CreateTable failed');
		});
	});

	describe('get', () => {
		it('should get item by simple key', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const mockData = { Item: { id: '123', name: 'test' } };
			mockClientSend.mockResolvedValue(mockData);

			const result = await model.get('123');
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(GetCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual({
				TableName: 'test_table',
				Key: { id: '123' }
			});
			expect(result).toEqual(mockData);
		});

		it('should get item by object key', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const mockData = { Item: { id: '123', sk: 'abc' } };
			mockClientSend.mockResolvedValue(mockData);

			const result = await model.get({ id: '123', sk: 'abc' });
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(GetCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual({
				TableName: 'test_table',
				Key: { id: '123', sk: 'abc' }
			});
			expect(result).toEqual(mockData);
		});

		it('should reject on error', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const error = new Error('Get failed');
			mockClientSend.mockRejectedValue(error);

			await expect(model.get('123')).rejects.toThrow('Get failed');
		});
	});

	describe('put', () => {
		it('should put item into table', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const item = { id: '123', name: 'test' };
			mockClientSend.mockResolvedValue({});

			const result = await model.put(item);
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(PutCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual({
				TableName: 'test_table',
				Item: item,
				ReturnValues: 'ALL_OLD'
			});
			expect(result).toEqual(item);
		});

		it('should reject on error', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const error = new Error('Put failed');
			mockClientSend.mockRejectedValue(error);

			await expect(model.put({ id: '123' })).rejects.toThrow('Put failed');
		});
	});

	describe('update', () => {
		it('should update item with simple key', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const mockData = { Attributes: { id: '123', name: 'updated' } };
			mockClientSend.mockResolvedValue(mockData);

			const result = await model.update('123', { name: 'updated' });
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual({
				TableName: 'test_table',
				Key: { id: '123' },
				UpdateExpression: 'SET #0 = :0',
				ExpressionAttributeNames: { '#0': 'name' },
				ExpressionAttributeValues: { ':0': 'updated' },
				ReturnValues: 'ALL_NEW'
			});
			expect(result).toEqual(mockData);
		});

		it('should update item with object key', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const mockData = { Attributes: { id: '123', sk: 'abc', name: 'updated' } };
			mockClientSend.mockResolvedValue(mockData);

			const result = await model.update({ id: '123', sk: 'abc' }, { name: 'updated' });
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual({
				TableName: 'test_table',
				Key: { id: '123', sk: 'abc' },
				UpdateExpression: 'SET #0 = :0',
				ExpressionAttributeNames: { '#0': 'name' },
				ExpressionAttributeValues: { ':0': 'updated' },
				ReturnValues: 'ALL_NEW'
			});
		});

		it('should handle multiple update fields', async () => {
			const model = new TestDynamoModel(mockGlobals);
			mockClientSend.mockResolvedValue({ Attributes: {} });

			await model.update('123', { name: 'updated', status: 'active' });
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual(
				expect.objectContaining({
					UpdateExpression: 'SET #0 = :0, #1 = :1',
					ExpressionAttributeNames: { '#0': 'name', '#1': 'status' },
					ExpressionAttributeValues: { ':0': 'updated', ':1': 'active' }
				})
			);
		});

		it('should reject on error', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const error = new Error('Update failed');
			mockClientSend.mockRejectedValue(error);

			await expect(model.update('123', { name: 'test' })).rejects.toThrow('Update failed');
		});
	});

	describe('listAppend', () => {
		it('should append to list with simple key', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const mockData = { Attributes: { id: '123', items: ['a', 'b'] } };
			mockClientSend.mockResolvedValue(mockData);

			const result = await model.listAppend('123', { items: ['b'] });
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual({
				TableName: 'test_table',
				Key: { id: '123' },
				UpdateExpression: 'SET #0 = list_append(#0, :0)',
				ExpressionAttributeNames: { '#0': 'items' },
				ExpressionAttributeValues: { ':0': ['b'] },
				ReturnValues: 'ALL_NEW'
			});
			expect(result).toEqual(mockData);
		});

		it('should append to list with object key', async () => {
			const model = new TestDynamoModel(mockGlobals);
			mockClientSend.mockResolvedValue({ Attributes: {} });

			await model.listAppend({ id: '123', sk: 'abc' }, { items: ['new'] });
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual(
				expect.objectContaining({
					Key: { id: '123', sk: 'abc' }
				})
			);
		});

		it('should handle multiple list appends', async () => {
			const model = new TestDynamoModel(mockGlobals);
			mockClientSend.mockResolvedValue({ Attributes: {} });

			await model.listAppend('123', { items: ['a'], tags: ['tag1'] });
			
			expect(mockClientSend).toHaveBeenCalledWith(expect.any(UpdateCommand));
			expect(mockClientSend.mock.calls.length).toBeGreaterThan(0);
			expect(mockClientSend.mock.calls[0]?.[0]?.input).toEqual(
				expect.objectContaining({
					UpdateExpression: 'SET #0 = list_append(#0, :0), #1 = list_append(#1, :1)',
					ExpressionAttributeNames: { '#0': 'items', '#1': 'tags' },
					ExpressionAttributeValues: { ':0': ['a'], ':1': ['tag1'] }
				})
			);
		});

		it('should reject on error', async () => {
			const model = new TestDynamoModel(mockGlobals);
			const error = new Error('ListAppend failed');
			mockClientSend.mockRejectedValue(error);

			await expect(model.listAppend('123', { items: ['a'] })).rejects.toThrow('ListAppend failed');
		});
	});
});
