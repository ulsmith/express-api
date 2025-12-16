import { GlobalsType } from '../Types/System';

/**
 * @module express-api/System/Core
 * @class Core
 * @description System class to give a base for all system classes, such as services, models, controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT 
 */
export default abstract class Core<T extends GlobalsType> {
	private globals: T;

	constructor(globals: T) {
		if (!globals) throw new Error('Must pass in globals object from application to all classes that extend core, to enable access to environment, services, client, socket and io etc');
		
		this.globals = globals;
	}

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	get $globals(): T { return this.globals }

	/**
	 * @public @get environment
	 * @desciption Get the environment data available to the system
	 * @return {Object} Middleware available
	 */
	get $environment(): T['$environment'] { return this.globals.$environment }

	/**
	 * @public @get client
	 * @desciption Get the client data available to the system
	 * @return {Object} Middleware available
	 */
	get $client(): T['$client'] { return this.globals.$client }

	/**
	 * @public @get services
	 * @desciption Get the services available to the system
	 * @return {Object} Services available
	 */
	get $services(): T['$services'] { return this.globals.$services }

	/**
	 * @public @get socket
	 * @desciption Get the socket available to the system
	 * @return {Object} socket available
	 */
	get $socket(): T['$socket'] { return this.globals.$socket }

	/**
	 * @public @get io
	 * @desciption Get the io available to the system
	 * @return {Object} io available
	 */
	get $io(): T['$io'] { return this.globals.$io }
}

