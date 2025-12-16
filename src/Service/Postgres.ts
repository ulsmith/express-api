import { Client } from 'pg';

/**
 * @module express-api/Service/Postgres
 * @class Postgres
 * @extends Client (the pg base class from npm)
 * @description Service class providing database connection using pg
 * @author Paul Smith
 * @license MIT
 * @example
 * new Postgres('192.168.1.10', 5432, 'your_db', 'your_user', 'your_password');
 */
export default class Postgres extends Client {

	public name: string;
	public service: string;
	public host: string;
	public port: number;
	public db: string;

	/**
	 * @public @method constructor
	 * @description Base method when instantiating class
	 */
	constructor(host: string, port: number, database: string, user: string, password: string, ssl?: any, connectionTimeoutMillis?: number) {
		const timeout = connectionTimeoutMillis || 20000;

		// create client
		super({
			host,
			port,
			database,
			user,
			password,
			ssl,
			connectionTimeoutMillis: timeout
		});

		// cache
		this.name = 'postgres';
		this.service = 'postgres:' + database;
		this.host = host;
		this.port = port;
		this.db = database;
	}
}

