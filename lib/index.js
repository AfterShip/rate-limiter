const fs = require('fs');
const path = require('path');

class Limiter {
	/**
	 *
	 * @param {Object} redisClient - redis connection client instance, ioredis only
	 * @param {string} key - key of the limiter
	 * @param {number} limit - rate limit within duration
	 * @param {number} duration - within this period (second), number of 'limit' tokens can be used
	 */
	constructor({
		redisClient, key, limit = 10, duration = 60
	}) {
		this.redisClient = redisClient;
		this.key = key ? `limit:${key}` : 'limit:default';
		this.limit = limit;
		this.duration = duration;

		this.redisClient.defineCommand('getRateLimit', {
			numberOfKeys: 1,
			lua: fs.readFileSync(path.join(__dirname, '/lua/get_token.lua')).toString()
		});
	}

	async get() {
		const result = await this.redisClient.getRateLimit(this.key, this.limit, this.duration);
		return {
			limit: this.limit,
			remaining: result[0],
			reset: parseInt(result[1], 10)
		};
	}

	/**
	 * A helper for getting token and fire the callback
	 * if rate limit reached, it will try to get token again until token available.
	 */
	async run() {
		const result = await this.get();
		if (result.remaining < 0) {
			await (new Promise((resolve) => {
				setTimeout(() => {
					resolve();
				}, 1000 * (result.reset + 1));
			}));
			return this.run();
		}
		return result;
	}
}

module.exports = Limiter;
