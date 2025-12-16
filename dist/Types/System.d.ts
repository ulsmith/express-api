import Request from '../System/Request.js';
import Response from '../System/Response.js';
export type GlobalsType = {
    $environment: {
        [key: string]: any;
    };
    $client: {
        [key: string]: any;
    };
    $services: {
        [key: string]: any;
    };
    $socket: {
        [key: string]: any;
    } | undefined;
    $io: {
        [key: string]: any;
    } | undefined;
};
export type ServiceType = {
    service: string;
};
export type MiddlewareType = {
    start?: (request: Request<any>) => Promise<Request<any>> | Request<any>;
    mount?: (request: Request<any>) => Promise<Request<any>> | Request<any>;
    in?: (request: Request<any>) => Promise<Request<any>> | Request<any>;
    out?: (response: Response<any>) => Promise<Response<any>> | Response<any>;
    end?: (response: Response<any>) => Promise<Response<any>> | Response<any>;
};
export type RouteType = {
    name: string;
    method: string | string[];
    path: string;
};
//# sourceMappingURL=System.d.ts.map