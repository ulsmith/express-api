// @ts-ignore - Optional peer dependency
import amqp from 'amqplib';

/**
 * @module express-api/Service/Amqp
 * @class Amqp
 * @description Service class providing AMQP connection using amqplib
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 * @example
 * new Amqp('alias', 'amqp(s)://abc.xyz', 5671, 'username', 'password');
 */
export default class Amqp {

	public name: string;
	public service: string;
	public alias: string;
	public host: string;
	public port: number;
	public amqp: typeof amqp;
	public connection: any;
	private user?: string;
	private password?: string;

	/**
	 * @public @method constructor
	 * @description Base method when instantiating class
	 */
	constructor(alias: string, host: string, port: number, user: string, password: string) {
		// cache amqplib
		this.amqp = amqp;

		// cache
		this.name = 'amqp';
		this.service = 'amqp:' + alias;
		this.alias = alias;
		this.host = host;
		this.port = port;
		this.user = user;
		this.password = password;
	}

	async connect(): Promise<void> {
		const p = this.host.split('://');
		if (p.length != 2) throw new Error('Invalid AMQP connection string');

		this.connection = await this.amqp.connect(`${p[0]}://${this.user}:${this.password}@${p[1]}:${this.port}`);
		delete this.user;
		delete this.password;
	}

	end(): Promise<void> {
		// need to bust the stack, next tick no worky
		return new Promise((res) => {
			const timer = setTimeout(() => {
				this.connection.close();
				res();
			}, 1);
			// Unref timer so it doesn't keep the process alive (prevents Jest open handle warnings)
			timer.unref();
		});
	}
}

