import { GlobalsType } from '../Types/System.js';
/**
 * @module express-api/System/Core
 * @class Core
 * @description System class to give a base for all system classes, such as services, models, controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default abstract class Core<T extends GlobalsType> {
    private globals;
    constructor(globals: T);
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    get $globals(): T;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    get $environment(): T['$environment'];
    /**
     * @public @get client
     * @desciption Get the client data available to the system
     * @return {Object} Middleware available
     */
    get $client(): T['$client'];
    /**
     * @public @get services
     * @desciption Get the services available to the system
     * @return {Object} Services available
     */
    get $services(): T['$services'];
    /**
     * @public @get socket
     * @desciption Get the socket available to the system
     * @return {Object} socket available
     */
    get $socket(): T['$socket'];
    /**
     * @public @get io
     * @desciption Get the io available to the system
     * @return {Object} io available
     */
    get $io(): T['$io'];
}
//# sourceMappingURL=Core.d.ts.map