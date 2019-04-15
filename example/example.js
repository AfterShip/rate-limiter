/* eslint-disable import/no-extraneous-dependencies,no-console */
const Redis = require('ioredis');
const Limiter = require('../lib/');


const redisClient = new Redis({
	port: 6379,
	host: '127.0.0.1',
	db: 0
});

redisClient.on('connect', (err) => {
	if (err) {
		console.log(err);
		return;
	}

	// limit to 2 request per every 10s
	const limiter = new Limiter({
		redisClient,
		key: 'the-user-api-key',
		limit: 2, // default is 10
		duration: 10 // default is 60s
	});

	limiter
		.get()
		.then((result) => {
			console.log(result);

			if (result.remaining >= 0) {
				console.log('I can do the request!');
			} else {
				console.log(`I run out of limit! Try again after ${result.reset} second.`);
			}
			process.exit(0);
		})
		.catch((e) => {
			console.log(e);
		});
});
