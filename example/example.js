'use strict';

var Limiter = require('../lib/');

var Redis = require('ioredis');
var redis_client = new Redis({
	port: 6379,
	host: '127.0.0.1',
	db: 0
});

redis_client.on('connect', function (err) {
	if (err) {
		console.log(err);
	} else {
		// limit to 2 request per every 10s
		var limiter = new Limiter({
			redis_client: redis_client,
			key: 'the-user-api-key',
			limit: 2, // default is 10
			duration: 10 // default is 60s
		});

		limiter.get(function (rate_limit_err, result) {
			if (rate_limit_err) {
				console.log(rate_limit_err);
			} else {
				console.log(result);

				// { limit: 2, remaining: 1, reset: 10 }
				if (result.remaining >= 0) {
					console.log('I can do the request!');
				} else {
					console.log('I run out of limit! Try again after ' + result.reset + ' second.');
				}
			}
		});
	}
});
