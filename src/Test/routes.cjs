// Mock routes for testing (CommonJS version for require())
module.exports = [
	{
		name: 'test',
		method: 'get',
		path: '/test'
	},
	{
		name: 'testWithId',
		method: 'get',
		path: '/test/{id}'
	},
	{
		name: 'testMultipleParams',
		method: 'post',
		path: '/test/{id}/item/{itemId}'
	},
	{
		name: 'socketTest',
		method: 'socket',
		path: '/test'
	}
];
