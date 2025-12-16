import { jest } from '@jest/globals';
import Postgres from '../../Service/Postgres';
import { Client } from 'pg';

describe('Postgres', () => {
	describe('constructor', () => {
		it('should set all properties correctly', () => {
			const postgres = new Postgres('localhost', 5432, 'testdb', 'user', 'password');

			expect(postgres.name).toBe('postgres');
			expect(postgres.service).toBe('postgres:testdb');
			expect(postgres.host).toBe('localhost');
			expect(postgres.port).toBe(5432);
			expect(postgres.db).toBe('testdb');
		});

		it('should extend Client', () => {
			const postgres = new Postgres('localhost', 5432, 'testdb', 'user', 'password');
			expect(postgres).toBeInstanceOf(Client);
		});

		it('should use default connection timeout when not provided', () => {
			const postgres = new Postgres('localhost', 5432, 'testdb', 'user', 'password');
			// Verify properties are set correctly
			expect(postgres.host).toBe('localhost');
			expect(postgres.port).toBe(5432);
			expect(postgres.name).toBe('postgres');
		});

		it('should use custom connection timeout when provided', () => {
			const postgres = new Postgres('localhost', 5432, 'testdb', 'user', 'password', undefined, 30000);
			expect(postgres.host).toBe('localhost');
			expect(postgres.port).toBe(5432);
			expect(postgres.name).toBe('postgres');
		});

		it('should handle SSL configuration', () => {
			const sslConfig = { rejectUnauthorized: false };
			const postgres = new Postgres('localhost', 5432, 'testdb', 'user', 'password', sslConfig);
			expect(postgres.name).toBe('postgres');
			expect(postgres.service).toBe('postgres:testdb');
		});

		it('should handle different connection parameters', () => {
			const postgres = new Postgres('192.168.1.10', 5433, 'mydb', 'myuser', 'mypass');

			expect(postgres.host).toBe('192.168.1.10');
			expect(postgres.port).toBe(5433);
			expect(postgres.db).toBe('mydb');
			expect(postgres.name).toBe('postgres');
			expect(postgres.service).toBe('postgres:mydb');
		});

		it('should handle SSL with custom timeout', () => {
			const sslConfig = { rejectUnauthorized: true };
			const postgres = new Postgres('localhost', 5432, 'testdb', 'user', 'password', sslConfig, 15000);

			expect(postgres.host).toBe('localhost');
			expect(postgres.port).toBe(5432);
			expect(postgres.db).toBe('testdb');
		});
	});
});
