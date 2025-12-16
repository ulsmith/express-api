import { Client } from 'pg';
/**
 * @module express-api/Service/Postgres
 * @class Postgres
 * @extends Client (the pg base class from npm)
 * @description Service class providing database connection using pg
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 * @example
 * new Postgres('192.168.1.10', 5432, 'your_db', 'your_user', 'your_password');
 */
export default class Postgres extends Client {
    name: string;
    service: string;
    host: string;
    port: number;
    db: string;
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     */
    constructor(host: string, port: number, database: string, user: string, password: string, ssl?: any, connectionTimeoutMillis?: number);
}
//# sourceMappingURL=Postgres.d.ts.map