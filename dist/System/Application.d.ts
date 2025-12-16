import { GlobalsType, ServiceType, MiddlewareType } from '../Types/System.js';
/**
 * @module express-api/System/Application
 * @class Application
 * @description System application handler
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Application<T extends GlobalsType & {
    $handler?: {
        file: string;
        type: 'es-module' | 'module';
    };
}> {
    globals: T;
    private request;
    private _middleware;
    private _controller;
    private _types;
    private _type;
    private _pwd;
    private _controllerDir;
    constructor(request: any, type?: 'aws' | 'azure' | 'express' | 'socket');
    service<TS extends ServiceType | ServiceType[]>(s: TS): void;
    middleware<TM extends MiddlewareType | MiddlewareType[]>(mw: TM): void;
    middlewareInit<TMI extends MiddlewareType | MiddlewareType[]>(mw: TMI): void;
    middlewareMount<TMM extends MiddlewareType | MiddlewareType[]>(mw: TMM): void;
    middlewareIn<TMIN extends MiddlewareType | MiddlewareType[]>(mw: TMIN): void;
    middlewareOut<TMO extends MiddlewareType | MiddlewareType[]>(mw: TMO): void;
    middlewareEnd<TME extends MiddlewareType | MiddlewareType[]>(mw: TME): void;
    run(): Promise<any>;
    private _process;
}
//# sourceMappingURL=Application.d.ts.map