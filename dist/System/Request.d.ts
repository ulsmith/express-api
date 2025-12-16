import { GlobalsType } from '../Types/System.js';
/**
 * @module express-api/System/Request
 * @class Request
 * @description System class to give a base for all system classes, such as services, models, controllers
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Request<T extends {
    context?: any;
    access?: any;
    resource?: any;
    headers?: {
        [key: string]: string | string[] | undefined;
    };
    body: any;
} = {
    context?: {
        [key: string]: any;
    };
    access?: {
        [key: string]: any;
    };
    resource?: {
        name: string;
        method: string;
        path: string;
    };
    headers?: {
        [key: string]: string | string[] | undefined;
    };
    body: any;
}, G extends GlobalsType = GlobalsType> {
    private globals;
    type: 'aws' | 'azure' | 'express' | 'socket';
    source: string;
    context: T['context'];
    access: T['access'];
    method: string;
    path: string;
    resource: T['resource'];
    parameters: {
        path: object;
        query: object;
    };
    headers: T['headers'];
    body: T['body'];
    requests: Request[];
    constructor(globals: G, type: Request['type'], data: any);
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _awsParse;
    /**
     * @public @get _awsRoute
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _awsRoute;
    /**
     * @private _awsEvent
     * @desciption This is a single AWS event of unknown type (SQS compatible, Event Bridge compatible), try to handle it
     * SQS, RMQ, event bridge etc...
     * Nameing of event/queue is [system] double seperator [location] double seperator [controller]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:system-name--controller-name]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:system.name..controller.name]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:system_name__controller_name]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:systemName/controllerName]
     * For system specific events all pointing to [system-name] system [src/Controller/ControllerName.js] controller [awsXxx] method
     *
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue-name]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue.name]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue_name]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queueName]
     * For generic events on service for any type of system subscribed, pointing to subscribed system [src/Controller/QueueName.js] controller [awsXxx] method
     *
     * Use double seperaters or slash in event/queue names to specify a sub folders in MVC
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue-name--something-else]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue.name..something.else]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queue_name__something_else]
     * eventSource [aws:XXX] eventSourceARN [arn:aws:XXX:us-east-2:123456789012:queueName/somethingElse]
     * All point to [src/Controller/QueueName/SomethinElse.js] controller [awsXxx] method
     *
     * for event bridge send in Input: '{"method": "get", "path": "controllerName"}' which will turn up on the data property
     */
    private _awsEvent;
    /**
     * @private _azureParse
     * @desciption parse the azure request
     */
    private _azureParse;
    /**
     * @public @get _azureRoute
     * @desciption Handle the azure route data
     */
    private _azureRoute;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _expressParse;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _expressRoute;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _socketParse;
    /**
     * @public @get environment
     * @desciption Get the environment data available to the system
     * @return {Object} Middleware available
     */
    private _socketRoute;
    /**
     * @private _parseBody
     * @desciption Parse the body of the request
     * @param {any} body The body of the request
     * @param {string} type The type of the body
     * @return {any} The parsed body
     */
    private _parseBody;
}
//# sourceMappingURL=Request.d.ts.map