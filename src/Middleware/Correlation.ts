import { GlobalsType } from '../Types/System';
import Middleware from '../Base/Middleware';
import Request from '../System/Request';
import Response from '../System/Response';
import CryptoTools from '../Library/CryptoTools';
import type { CorrelationContext } from '../Base/Service/ExpressApiService';

/**
 * @module express-api/Middleware/Correlation
 * @class Correlation
 * @extends Middleware
 * @description Middleware for correlation and identity context on incoming requests
 * @author Paul Smith (ulsmith) <paul.smith@ulsmith.net>
 * @license MIT
 */
export default class Correlation<T extends GlobalsType & { $client: { correlation?: CorrelationContext } }> extends Middleware<T> {
	private type: 'api' | 'service';

	constructor(globals: T, type: 'api' | 'service') {
		super(globals);

		this.type = type;
	}

	/**
	 * @public @method mount
	 * @description Invoke middleware for incoming event at mount time
	 * @param request The incoming request
	 * @returns The updated request
	 */
	async mount(request: Request): Promise<Request> {
		if (this.type !== 'api') return request;

		this.$client.correlation = { id: CryptoTools.generateUuid(), userId: '', companyId: '', impersonatorId: '' };

		return request;
	}

	/**
	 * @public @method in
	 * @description Invoke middleware for incoming event at in time
	 * @param request The incoming request
	 * @returns The updated request
	 */
	async in(request: Request): Promise<Request> {
		if (this.type !== 'service') return request;

		this.$client.correlation = {
			id: (request.headers?.['X-Correlation-Id'] || request.headers?.['x-correlation-id']) as string,
			userId: (request.headers?.['X-User-Id'] || request.headers?.['x-user-id']) as string,
			companyId: (request.headers?.['X-Company-Id'] || request.headers?.['x-company-id']) as string,
			impersonatorId: (request.headers?.['X-Impersonator-Id'] || request.headers?.['x-impersonator-id']) as string,
		};

		return request;
	}

	/**
	 * @public @method out
	 * @description Invoke middleware for outgoing event at out time
	 * @param response The outgoing response
	 * @returns The updated response
	 */
	async out(response: Response): Promise<Response> {
		if (this.type !== 'service') return response;

		response.headers['X-Correlation-Id'] = this.$client.correlation?.id || '';
		response.headers['X-User-Id'] = this.$client.correlation?.userId || '';
		response.headers['X-Company-Id'] = this.$client.correlation?.companyId || '';
		response.headers['X-Impersonator-Id'] = this.$client.correlation?.impersonatorId || '';

		return response;
	}
}
