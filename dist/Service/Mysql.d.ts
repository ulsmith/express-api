import mysql2 from 'mysql2/promise';
/**
 * @module express-api/Service/Mysql
 * @class Mysql
 * @description Service class providing database connection using mysql2
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 * @example
 * new Mysql('192.168.1.10', 3306, 'your_db', 'your_user', 'your_password');
 */
export default class Mysql {
    name: string;
    service: string;
    host: string;
    port: number;
    db: string;
    mysql: typeof mysql2;
    con: any;
    private user?;
    private password?;
    /**
     * @public @method constructor
     * @description Base method when instantiating class
     */
    constructor(host: string, port: number, db: string, user: string, password: string);
    connect(): Promise<void>;
    end(): Promise<void>;
}
//# sourceMappingURL=Mysql.d.ts.map