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
    name: string;
    service: string;
    alias: string;
    host: string;
    port: number;
    amqp: typeof amqp;
    connection: any;
    private user?;
    private password?;
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     */
    constructor(alias: string, host: string, port: number, user: string, password: string);
    connect(): Promise<void>;
    end(): Promise<void>;
}
//# sourceMappingURL=Amqp.d.ts.map