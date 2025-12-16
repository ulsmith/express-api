import { jest } from '@jest/globals';
import ModelPG from '../../../Base/Model/Postgres';
import Core from '../../../System/Core';
import ModelError from '../../../Error/Model';
import { GlobalsType } from '../../../Types/System';

// Mock Postgres client
const mockQuery = jest.fn<() => Promise<any>>();

const createMockGlobals = (): GlobalsType => ({
	$environment: { NODE_ENV: 'test' },
	$client: { id: 'test-client' },
	$services: {
		'postgres:testdb': {
			query: mockQuery
		}
	},
	$socket: {} as any,
	$io: {} as any,
});

// Create a concrete implementation for testing
class TestPGModel extends ModelPG<GlobalsType> {
	constructor(globals: GlobalsType, dbname: string = 'testdb', table: string = 'schema.test_table', params?: any) {
		super(globals, dbname, table, params);
	}
}

describe('ModelPG', () => {
	let mockGlobals: GlobalsType;

	beforeEach(() => {
		mockGlobals = createMockGlobals();
		jest.clearAllMocks();
	});

	describe('constructor', () => {
		it('should extend Core', () => {
			const model = new TestPGModel(mockGlobals);
			expect(model).toBeInstanceOf(Core);
			expect(model).toBeInstanceOf(ModelPG);
		});

		it('should set default column names', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect(model.dbname).toBe('testdb');
			expect(model.table).toBe('schema.test_table');
			expect(model.idCol).toBe('id');
			expect(model.createdCol).toBe('created');
			expect(model.updatedCol).toBe('updated');
			expect(model.deleteCol).toBe('deleted');
			expect(model.softDelete).toBeUndefined();
		});

		it('should accept custom params', () => {
			const model = new TestPGModel(mockGlobals, 'testdb', 'schema.test_table', {
				softDelete: true,
				idCol: 'uuid',
				createdCol: 'created_at',
				updatedCol: 'updated_at',
				deleteCol: 'deleted_at'
			});
			
			expect(model.softDelete).toBe(true);
			expect(model.idCol).toBe('uuid');
			expect(model.createdCol).toBe('created_at');
			expect(model.updatedCol).toBe('updated_at');
			expect(model.deleteCol).toBe('deleted_at');
		});
	});

	describe('getters', () => {
		it('should return db service via db getter', () => {
			const model = new TestPGModel(mockGlobals);
			expect(model.db).toBe((mockGlobals.$services as any)['postgres:testdb']);
		});
	});

	describe('notSoftDeleted', () => {
		it('should return empty string when softDelete is false', () => {
			const model = new TestPGModel(mockGlobals);
			expect(model.notSoftDeleted('AND')).toBe('');
		});

		it('should return soft delete check when softDelete is true', () => {
			const model = new TestPGModel(mockGlobals, 'testdb', 'schema.test_table', { softDelete: true });
			expect(model.notSoftDeleted('AND')).toBe('AND "deleted" IS NULL');
			expect(model.notSoftDeleted('WHERE')).toBe('WHERE "deleted" IS NULL');
		});
	});

	describe('get', () => {
		it('should get item by id', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '123', name: 'test' }] });

			const result = await model.get('123');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'SELECT * FROM "schema"."test_table" WHERE "id" = $1  LIMIT 1;',
				['123']
			);
			expect(result).toEqual({ id: '123', name: 'test' });
		});

		it('should return empty object when not found', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			const result = await model.get('123');
			expect(result).toEqual({});
		});

		it('should include soft delete check when enabled', async () => {
			const model = new TestPGModel(mockGlobals, 'testdb', 'schema.test_table', { softDelete: true });
			mockQuery.mockResolvedValue({ rows: [] });

			await model.get('123');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'SELECT * FROM "schema"."test_table" WHERE "id" = $1 AND "deleted" IS NULL LIMIT 1;',
				['123']
			);
		});
	});

	describe('find', () => {
		it('should find items by where object', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1' }, { id: '2' }] });

			const result = await model.find({ status: 'active' });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'SELECT * FROM "schema"."test_table" WHERE  "status" = $1  ;',
				['active']
			);
			expect(result).toEqual([{ id: '1' }, { id: '2' }]);
		});

		it('should handle multiple where conditions', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			await model.find({ status: 'active', type: 'user' });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'SELECT * FROM "schema"."test_table" WHERE  "status" = $1  AND  "type" = $2  ;',
				['active', 'user']
			);
		});
	});

	describe('first', () => {
		it('should get first item without where', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });

			const result = await model.first();
			
			expect(mockQuery).toHaveBeenCalledWith(
				'SELECT * FROM "schema"."test_table"  ORDER BY "created" ASC LIMIT 1;'
			);
			expect(result).toEqual({ id: '1' });
		});

		it('should get first item with where', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });

			await model.first({ status: 'active' });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'SELECT * FROM "schema"."test_table" WHERE  "status" = $1   ORDER BY "created" ASC LIMIT 1;',
				['active']
			);
		});

		it('should throw when createdCol is not set', () => {
			const model = new TestPGModel(mockGlobals);
			model.createdCol = '';

			expect(() => model.first()).toThrow(ModelError);
		});
	});

	describe('last', () => {
		it('should get last item without where', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });

			const result = await model.last();
			
			expect(mockQuery).toHaveBeenCalledWith(
				'SELECT * FROM "schema"."test_table"  ORDER BY "created" DESC LIMIT 1;'
			);
			expect(result).toEqual({ id: '1' });
		});

		it('should get last item with where', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });

			await model.last({ status: 'active' });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'SELECT * FROM "schema"."test_table" WHERE  "status" = $1   ORDER BY "created" DESC LIMIT 1;',
				['active']
			);
		});

		it('should throw when createdCol is not set', () => {
			const model = new TestPGModel(mockGlobals);
			model.createdCol = '';

			expect(() => model.last()).toThrow(ModelError);
		});
	});

	describe('all', () => {
		it('should get all items', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1' }, { id: '2' }] });

			await model.all();
			
			expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM "schema"."test_table" ;');
		});
	});

	describe('insert', () => {
		it('should insert single item', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });

			await model.insert({ name: 'test' });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'INSERT INTO "schema"."test_table" ("name") VALUES ($1) ;',
				['test']
			);
		});

		it('should insert with returning clause', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1' }] });

			await model.insert({ name: 'test' }, 'id');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'INSERT INTO "schema"."test_table" ("name") VALUES ($1) RETURNING "id";',
				['test']
			);
		});

		it('should insert with array returning clause', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '1', name: 'test' }] });

			await model.insert({ name: 'test' }, ['id', 'name']);
			
			expect(mockQuery).toHaveBeenCalledWith(
				'INSERT INTO "schema"."test_table" ("name") VALUES ($1) RETURNING "id","name";',
				['test']
			);
		});

		it('should insert multiple items', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			await model.insert([{ name: 'test1' }, { name: 'test2' }]);
			
			expect(mockQuery).toHaveBeenCalledWith(
				'INSERT INTO "schema"."test_table" ("name") VALUES ($1),($2) ;',
				['test1', 'test2']
			);
		});

		it('should handle point data', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			await model.insert({ location: { x: 1.5, y: 2.5 } });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'INSERT INTO "schema"."test_table" ("location") VALUES (POINT($1, $2)) ;',
				[1.5, 2.5]
			);
		});

		it('should handle duplicate key error', async () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = { name: { type: 'string' } };
			const error = { code: 23505 };
			mockQuery.mockRejectedValue(error);

			await expect(model.insert({ name: 'test' })).rejects.toThrow(ModelError);
		});

		it('should re-throw non-duplicate key errors', async () => {
			const model = new TestPGModel(mockGlobals);
			const error = new Error('Connection failed');
			mockQuery.mockRejectedValue(error);

			await expect(model.insert({ name: 'test' })).rejects.toThrow('Connection failed');
		});
	});

	describe('update', () => {
		it('should update by id', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			await model.update('123', { name: 'updated' });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'UPDATE "schema"."test_table" SET  "name" = $1  WHERE  "id" = $2  ;',
				['updated', '123']
			);
		});

		it('should update by where object', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			await model.update({ id: '123', status: 'active' }, { name: 'updated' });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'UPDATE "schema"."test_table" SET  "name" = $1  WHERE  "id" = $2  AND  "status" = $3  ;',
				['updated', '123', 'active']
			);
		});

		it('should update with returning clause', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [{ id: '123' }] });

			await model.update('123', { name: 'updated' }, 'id');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'UPDATE "schema"."test_table" SET  "name" = $1  WHERE  "id" = $2  RETURNING "id";',
				['updated', '123']
			);
		});

		it('should throw when where is invalid', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect(() => model.update(null, { name: 'test' })).toThrow(ModelError);
			expect(() => model.update({}, { name: 'test' })).toThrow(ModelError);
		});

		it('should handle point data with columns defined', async () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = { location: { type: 'point' } };
			mockQuery.mockResolvedValue({ rows: [] });

			await model.update('123', { location: { x: 1.5, y: 2.5 } });
			
			expect(mockQuery).toHaveBeenCalledWith(
				'UPDATE "schema"."test_table" SET  "location" = POINT($1, $2)  WHERE  "id" = $3  ;',
				[1.5, 2.5, '123']
			);
		});

		it('should handle duplicate key error on update', async () => {
			const model = new TestPGModel(mockGlobals);
			const error = { code: 23505 };
			mockQuery.mockRejectedValue(error);

			await expect(model.update('123', { name: 'test' })).rejects.toThrow(ModelError);
		});

		it('should re-throw non-duplicate key errors on update', async () => {
			const model = new TestPGModel(mockGlobals);
			const error = new Error('Connection failed');
			mockQuery.mockRejectedValue(error);

			await expect(model.update('123', { name: 'test' })).rejects.toThrow('Connection failed');
		});
	});

	describe('delete', () => {
		it('should hard delete by default', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			await model.delete('123');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'DELETE FROM "schema"."test_table" WHERE id = $1;',
				['123']
			);
		});

		it('should soft delete when softDelete is true', async () => {
			const model = new TestPGModel(mockGlobals, 'testdb', 'schema.test_table', { softDelete: true });
			mockQuery.mockResolvedValue({ rows: [] });

			await model.delete('123');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'UPDATE "schema"."test_table" SET "deleted" = $1 WHERE "id" = $2;',
				[expect.any(Date), '123']
			);
		});

		it('should force hard delete with type parameter', async () => {
			const model = new TestPGModel(mockGlobals, 'testdb', 'schema.test_table', { softDelete: true });
			mockQuery.mockResolvedValue({ rows: [] });

			await model.delete('123', 'hard');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'DELETE FROM "schema"."test_table" WHERE id = $1;',
				['123']
			);
		});

		it('should force soft delete with type parameter', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			await model.delete('123', 'soft');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'UPDATE "schema"."test_table" SET "deleted" = $1 WHERE "id" = $2;',
				[expect.any(Date), '123']
			);
		});
	});

	describe('restore', () => {
		it('should restore soft deleted item', async () => {
			const model = new TestPGModel(mockGlobals);
			mockQuery.mockResolvedValue({ rows: [] });

			await model.restore('123');
			
			expect(mockQuery).toHaveBeenCalledWith(
				'UPDATE "schema"."test_table" SET "deleted" = $1 WHERE "id" = $2;',
				[null, '123']
			);
		});
	});

	describe('mapDataToColumn', () => {
		it('should throw when columns not set', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect(() => model.mapDataToColumn({ name: 'test' })).toThrow(ModelError);
		});

		it('should map data to columns', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				name: { type: 'string', required: true },
				age: { type: 'number' }
			};

			const result = model.mapDataToColumn({ name: 'test', age: 25 });
			
			expect(result).toEqual({ name: 'test', age: 25 });
		});

		it('should throw when required field is missing', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				name: { type: 'string', required: true }
			};

			expect(() => model.mapDataToColumn({})).toThrow(ModelError);
		});

		it('should allow partial data with partial flag', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				name: { type: 'string', required: true },
				age: { type: 'number' }
			};

			const result = model.mapDataToColumn({ age: 25 }, true);
			
			expect(result).toEqual({ age: 25 });
		});

		it('should throw when partial data is empty', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				name: { type: 'string', required: true }
			};

			expect(() => model.mapDataToColumn({}, true)).toThrow(ModelError);
		});

		it('should handle null values', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				name: { type: 'string' }
			};

			const result = model.mapDataToColumn({ name: null }, true);
			
			expect(result).toEqual({ name: null });
		});

		it('should stringify JSON data', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				data: { type: 'json' }
			};

			const result = model.mapDataToColumn({ data: { foo: 'bar' } }, true);
			
			expect(result).toEqual({ data: '{"foo":"bar"}' });
		});

		it('should throw for invalid point data', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				location: { type: 'point', required: true }
			};

			expect(() => model.mapDataToColumn({ location: 'invalid' })).toThrow(ModelError);
		});

		it('should throw for type mismatch', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				name: { type: 'string', required: true },
				age: { type: 'number' }
			};

			// Pass number when string expected
			expect(() => model.mapDataToColumn({ name: 123, age: 25 })).toThrow(ModelError);
		});
	});

	describe('mapDataArrayToColumn', () => {
		it('should map array of data', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = {
				name: { type: 'string', required: true }
			};

			const result = model.mapDataArrayToColumn([{ name: 'test1' }, { name: 'test2' }]);
			
			expect(result).toEqual([{ name: 'test1' }, { name: 'test2' }]);
		});

		it('should throw when data is not array', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = { name: { type: 'string' } };

			expect(() => model.mapDataArrayToColumn(null)).toThrow(ModelError);
			expect(() => model.mapDataArrayToColumn({})).toThrow(ModelError);
		});

		it('should return undefined for partial with no data', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = { name: { type: 'string' } };

			const result = model.mapDataArrayToColumn(null, true);
			expect(result).toBeUndefined();
		});
	});

	describe('parseError', () => {
		it('should return expected columns when no error', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = { name: { type: 'string' } };

			const result = model.parseError(null);
			
			expect(result).toEqual({ expected: { name: { type: 'string' } } });
		});

		it('should parse uuid error', () => {
			const model = new TestPGModel(mockGlobals);
			
			const result = model.parseError({ code: '22P02', routine: 'string_to_uuid' });
			
			expect(result).toEqual({ error: 'invalid data', detail: 'uuid' });
		});

		it('should parse unique constraint error', () => {
			const model = new TestPGModel(mockGlobals);
			
			const result = model.parseError({ code: '23505', detail: 'Key (email)=(test@test.com) already exists.' });
			
			expect(result).toEqual({ error: 'not unique', detail: 'email' });
		});

		it('should return unknown for other errors', () => {
			const model = new TestPGModel(mockGlobals);
			
			const result = model.parseError({ code: '99999' });
			
			expect(result).toEqual({ error: 'unknown' });
		});
	});

	describe('checkColumnsStrict', () => {
		it('should return false when columns not set', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect(model.checkColumnsStrict({ name: 'test' })).toBe(false);
		});

		it('should return false when data has extra keys', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = { name: { type: 'string' } };
			
			expect(model.checkColumnsStrict({ name: 'test', extra: 'field' })).toBe(false);
		});

		it('should return false when required field is missing', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = { name: { type: 'string', required: true } };
			
			expect(model.checkColumnsStrict({})).toBe(false);
		});

		it('should return true when data matches columns', () => {
			const model = new TestPGModel(mockGlobals);
			model.columns = { 
				name: { type: 'string', required: true },
				age: { type: 'number' }
			};
			
			expect(model.checkColumnsStrict({ name: 'test', age: 25 })).toBe(true);
		});
	});

	describe('inject', () => {
		it('should quote simple column name', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect(model.inject('column_name')).toBe('"column_name"');
		});

		it('should quote table.column format', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect(model.inject('table.column')).toBe('"table"."column"');
		});

		it('should not quote asterisk', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect(model.inject('table.*')).toBe('"table".*');
		});

		it('should remove invalid characters', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect(model.inject('column; DROP TABLE--')).toBe('"columnDROPTABLE"');
		});
	});

	describe('__cleanIncommingData', () => {
		it('should remove default columns', () => {
			const model = new TestPGModel(mockGlobals);
			
			const result = (model as any).__cleanIncommingData({
				id: '123',
				name: 'test',
				created: new Date(),
				updated: new Date(),
				deleted: new Date()
			});
			
			expect(result).toEqual({ name: 'test' });
		});

		it('should keep id when skipId is true', () => {
			const model = new TestPGModel(mockGlobals);
			
			const result = (model as any).__cleanIncommingData({
				id: '123',
				name: 'test'
			}, true);
			
			expect(result).toEqual({ id: '123', name: 'test' });
		});

		it('should handle array of data', () => {
			const model = new TestPGModel(mockGlobals);
			
			const result = (model as any).__cleanIncommingData([
				{ id: '1', name: 'test1' },
				{ id: '2', name: 'test2' }
			]);
			
			expect(result).toEqual([{ name: 'test1' }, { name: 'test2' }]);
		});

		it('should return undefined for no data', () => {
			const model = new TestPGModel(mockGlobals);
			
			expect((model as any).__cleanIncommingData(null)).toBeUndefined();
			expect((model as any).__cleanIncommingData(undefined)).toBeUndefined();
		});
	});
});
