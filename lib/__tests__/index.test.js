/* eslint-disable no-console,global-require */


describe('test processor', () => {
	beforeEach(() => {
		jest.resetModules();
	});

	afterAll(() => {
		jest.resetModules();
	});

	describe('get', () => {
		it('should return rate limit meta', async () => {
			const redisClient = {
				defineCommand: jest.fn().mockImplementationOnce(() => {
					console.log('defineCommand mock');
				}),
				getRateLimit: jest.fn().mockImplementationOnce(() => {
					console.log('mockImplementationOnce mock');
					return [90, 10];
				})
			};

			const Limiter = require('../index');
			const limiter = new Limiter({
				redisClient,
				key: 'test',
				limit: 100,
				duration: 600
			});
			const result = await limiter.get();
			expect(result).toEqual({
				limit: 100,
				remaining: 90,
				reset: 10
			});
			expect(redisClient.defineCommand.mock.calls.length).toBe(1);
			expect(redisClient.defineCommand.mock.calls[0][0]).toBe('getRateLimit');
			expect(redisClient.getRateLimit.mock.calls.length).toBe(1);
			expect(redisClient.getRateLimit.mock.calls[0][0]).toBe('limit:test');
			expect(redisClient.getRateLimit.mock.calls[0][1]).toBe(100);
			expect(redisClient.getRateLimit.mock.calls[0][2]).toBe(600);
		});

		it('should return rate limit meta with default value', async () => {
			const redisClient = {
				defineCommand: jest.fn().mockImplementationOnce(() => {
					console.log('defineCommand mock');
				}),
				getRateLimit: jest.fn().mockImplementationOnce(() => {
					console.log('mockImplementationOnce mock');
					return [90, 10];
				})
			};

			const Limiter = require('../index');
			const limiter = new Limiter({
				redisClient
			});
			const result = await limiter.get();
			expect(result).toEqual({
				limit: 10,
				remaining: 90,
				reset: 10
			});
			expect(redisClient.defineCommand.mock.calls.length).toBe(1);
			expect(redisClient.defineCommand.mock.calls[0][0]).toBe('getRateLimit');
			expect(redisClient.getRateLimit.mock.calls.length).toBe(1);
			expect(redisClient.getRateLimit.mock.calls[0][0]).toBe('limit:default');
			expect(redisClient.getRateLimit.mock.calls[0][1]).toBe(10);
			expect(redisClient.getRateLimit.mock.calls[0][2]).toBe(60);
		});
	});
	describe('run', () => {
		it('should execute get', async () => {
			const redisClient = {
				defineCommand: jest.fn().mockImplementationOnce(() => {
					console.log('defineCommand mock');
				}),
				getRateLimit: jest.fn().mockImplementationOnce(() => {
					console.log('mockImplementationOnce mock');
					return [90, 10];
				})
			};

			const Limiter = require('../index');

			Limiter.prototype.get = jest.fn().mockReturnValueOnce({
				limit: 100,
				remaining: 90,
				reset: 10
			});

			const limiter = new Limiter({
				redisClient,
				key: 'test',
				limit: 100,
				duration: 600
			});

			const result = await limiter.run();

			expect(result).toEqual({
				limit: 100,
				remaining: 90,
				reset: 10
			});
			expect(limiter.get.mock.calls.length).toBe(1);
		});

		it('should execute get with pause', async () => {
			const redisClient = {
				defineCommand: jest.fn().mockImplementationOnce(() => {
					console.log('defineCommand mock');
				}),
				getRateLimit: jest.fn().mockImplementationOnce(() => {
					console.log('mockImplementationOnce mock');
					return [90, 10];
				})
			};

			const Limiter = require('../index');

			Limiter.prototype.get = jest.fn().mockReturnValueOnce({
				limit: 100,
				remaining: -1,
				reset: 1
			}).mockReturnValueOnce({
				limit: 100,
				remaining: 90,
				reset: 10
			});

			const limiter = new Limiter({
				redisClient,
				key: 'test',
				limit: 100,
				duration: 600
			});

			const result = await limiter.run();

			expect(result).toEqual({
				limit: 100,
				remaining: 90,
				reset: 10
			});

			expect(limiter.get.mock.calls.length).toBe(2);
		});
	});
});
