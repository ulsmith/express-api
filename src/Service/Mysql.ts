// @ts-ignore - Optional peer dependency
import mysql2 from 'mysql2/promise';

/**
 * @module express-api/Service/Mysql
 * @class Mysql
 * @description Service class providing database connection using mysql2
 * @author Paul Smith
 * @license MIT
 * @example
 * new Mysql('192.168.1.10', 3306, 'your_db', 'your_user', 'your_password');
 */
export default class Mysql {

	public name: string;
	public service: string;
	public host: string;
	public port: number;
	public db: string;
	public mysql: typeof mysql2;
	public con: any;
	private user?: string;
	private password?: string;

	/**
	 * @public @method constructor
	 * @description Base method when instantiating class
	 */
	constructor(host: string, port: number, db: string, user: string, password: string) {
		// create mysql2
		this.mysql = mysql2;

		// cache
		this.name = 'mysql';
		this.service = 'mysql:' + db;
		this.host = host;
		this.port = port;
		this.db = db;
		this.user = user;
		this.password = password;
	}

	connect(): Promise<void> {
		return this.mysql.createConnection({
			host: this.host,
			port: this.port,
			user: this.user,
			password: this.password,
			database: this.db
		}).then((con: any) => {
			this.con = con; 
			delete this.user;
			delete this.password;
		});
	}

	end(): Promise<void> {
		return this.con.end();
	}
}

