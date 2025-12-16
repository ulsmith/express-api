import Cors from '../../Middleware/Cors';
import { GlobalsType } from '../../Types/System';

const mockGlobals: GlobalsType = {
	$environment: { NODE_ENV: 'test' },
	$client: { origin: 'https://example.com' },
	$services: {},
	$socket: {} as any,
	$io: {} as any,
};

describe('Cors', () => {
	let cors: Cors<GlobalsType>;
	let mockResponse: any;

	beforeEach(() => {
		cors = new Cors(mockGlobals);
		mockResponse = {
			headers: {},
			status: 200,
			body: { data: 'test' },
		};
	});

	describe('out', () => {
		it('should add CORS headers to response', () => {
			const result = cors.out(mockResponse);
			expect(result.headers['Access-Control-Allow-Origin']).toBe('https://example.com');
			expect(result.headers['Access-Control-Allow-Credentials']).toBe('true');
		});

		it('should set Access-Control-Allow-Headers', () => {
			const result = cors.out(mockResponse);
			expect(result.headers['Access-Control-Allow-Headers']).toBe('Accept, Cache-Control, Content-Type, Content-Length, Authorization, Pragma, Expires, Api-Key, Accept-Encoding');
		});

		it('should set Access-Control-Allow-Methods', () => {
			const result = cors.out(mockResponse);
			expect(result.headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS, PATCH');
		});

		it('should set Access-Control-Expose-Headers', () => {
			const result = cors.out(mockResponse);
			expect(result.headers['Access-Control-Expose-Headers']).toBe('Cache-Control, Content-Type, Authorization, Pragma, Expires');
		});

		it('should preserve existing headers', () => {
			mockResponse.headers['Content-Type'] = 'application/json';
			const result = cors.out(mockResponse);
			expect(result.headers['Content-Type']).toBe('application/json');
		});

		it('should preserve response body and status', () => {
			const result = cors.out(mockResponse);
			expect(result.body).toEqual({ data: 'test' });
			expect(result.status).toBe(200);
		});
	});
});

