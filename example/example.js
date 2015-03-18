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
					rate_limit: 2,
					duration: 10
				});

				r3limiter.get(function(err, results) {
					console.log(err);
					console.log(results);
				});
			}
		});
	}
});