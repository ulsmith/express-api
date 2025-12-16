import { jest } from '@jest/globals';
import Mysql from '../../Service/Mysql';

describe('Mysql', () => {
	describe('constructor', () => {
		it('should set all properties correctly', () => {
			const mysql = new Mysql('localhost', 3306, 'testdb', 'user', 'password');

			expect(mysql.name).toBe('mysql');
			expect(mysql.service).toBe('mysql:testdb');
			expect(mysql.host).toBe('localhost');
			expect(mysql.port).toBe(3306);
			expect(mysql.db).toBe('testdb');
			expect(mysql.mysql).toBeDefined();
		});

		it('should store user and password privately', () => {
			const mysql = new Mysql('localhost', 3306, 'testdb', 'user', 'password');

			expect((mysql as any).user).toBe('user');
			expect((mysql as any).password).toBe('password');
		});
	});

	describe('connect', () => {
		it('should create connection with correct parameters', async () => {
			const mysql = new Mysql('localhost', 3306, 'testdb', 'user', 'password');
			const mockConnection = { end: jest.fn() };
			const createConnectionSpy = jest.spyOn(mysql.mysql, 'createConnection').mockResolvedValue(mockConnection as any);

			await mysql.connect();

			expect(createConnectionSpy).toHaveBeenCalledWith({
				host: 'localhost',
				port: 3306,
				user: 'user',
				password: 'password',
				database: 'testdb'
			});
			expect(mysql.con).toBe(mockConnection);
		});

		it('should clear user and password after connection', async () => {
			const mysql = new Mysql('localhost', 3306, 'testdb', 'user', 'password');

			expect((mysql as any).user).toBe('user');
			expect((mysql as any).password).toBe('password');

			const mockConnection = { end: jest.fn() };
			jest.spyOn(mysql.mysql, 'createConnection').mockResolvedValue(mockConnection as any);

			await mysql.connect();

			expect((mysql as any).user).toBeUndefined();
			expect((mysql as any).password).toBeUndefined();
		});

		it('should handle different connection parameters', async () => {
			const mysql = new Mysql('192.168.1.10', 3307, 'mydb', 'myuser', 'mypass');
			const mockConnection = { end: jest.fn() };
			const createConnectionSpy = jest.spyOn(mysql.mysql, 'createConnection').mockResolvedValue(mockConnection as any);

			await mysql.connect();

			expect(createConnectionSpy).toHaveBeenCalledWith({
				host: '192.168.1.10',
				port: 3307,
				user: 'myuser',
				password: 'mypass',
				database: 'mydb'
			});
		});

		it('should handle connection errors', async () => {
			const mysql = new Mysql('localhost', 3306, 'testdb', 'user', 'password');
			const error = new Error('Connection failed');
			jest.spyOn(mysql.mysql, 'createConnection').mockRejectedValue(error);

			await expect(mysql.connect()).rejects.toThrow('Connection failed');
		});
	});

	describe('end', () => {
		it('should close connection', async () => {
			const mysql = new Mysql('localhost', 3306, 'testdb', 'user', 'password');
			const mockEnd = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
			const mockConnection = { end: mockEnd };
			jest.spyOn(mysql.mysql, 'createConnection').mockResolvedValue(mockConnection as any);
			await mysql.connect();

			await mysql.end();

			expect(mockEnd).toHaveBeenCalled();
		});

		it('should return a promise that resolves after closing', async () => {
			const mysql = new Mysql('localhost', 3306, 'testdb', 'user', 'password');
			const mockEnd = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
			const mockConnection = { end: mockEnd };
			jest.spyOn(mysql.mysql, 'createConnection').mockResolvedValue(mockConnection as any);
			await mysql.connect();

			const result = await mysql.end();

			expect(result).toBeUndefined();
			expect(mockEnd).toHaveBeenCalled();
		});

		it('should handle end errors', async () => {
			const mysql = new Mysql('localhost', 3306, 'testdb', 'user', 'password');
			const error = new Error('End failed');
			const mockEnd = jest.fn<() => Promise<void>>().mockRejectedValue(error);
			const mockConnection = { end: mockEnd };
			jest.spyOn(mysql.mysql, 'createConnection').mockResolvedValue(mockConnection as any);
			await mysql.connect();

			await expect(mysql.end()).rejects.toThrow('End failed');
		});
	});
});
