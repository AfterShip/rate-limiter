var R3Limiter = require('../lib/');

var redis = require('redis');
var redis_client = redis.createClient(6379, 'localhost');

redis_client.on('connect', function(err) {
	if (err) {
		console.log(err);
	} else {
		redis_client.select(0, function(err) {
			if (err) {
				console.log(err);
			} else {
				// limit to 2 request per every 10s
				var r3limiter = new R3Limiter({
					redis_client: redis_client,
					key: 'the-user-api-key',
					limit: 2, // default is 10
					duration: 10 // default is 60s
				});

				r3limiter.get(function(err, result) {
					if (err) {
						console.log(err);
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
	}
});