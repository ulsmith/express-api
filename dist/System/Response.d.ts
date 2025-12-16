/**
 * @module express-api/System/Response
 * @class Response
 * @description System class to give a base for all system classes, such as services, models, controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Response<T extends {
    headers: {
        [key: string]: string | string[] | undefined;
    };
    body: any;
} = {
    headers: {
        [key: string]: string | string[] | undefined;
    };
    body: any;
}> {
    type: 'aws' | 'azure' | 'express' | 'socket';
    status: number;
    headers: T['headers'];
    body: T['body'];
    isBase64Encoded: boolean;
    constructor(type: Response['type'], data: any);
    get(): any;
    set(data: any): void;
    private _parseBody;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _awsConvert;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _azureConvert;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _expressConvert;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _socketConvert;
}
//# sourceMappingURL=Response.d.ts.map