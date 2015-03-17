var Rlimiter = require('..');

var redis = require('redis');
var redis_client = redis.createClient();
redis_client.on('connect', function(err) {
	if (err) {
		console.log(err);
	} else {
		redis_client.select(3, function(err) {
			if (err) {
				console.log(err);
			} else {
				var rlimiter = new Rlimiter({
					redis_client: redis_client,
					key: 'usps',
					rate_limit: 10,
					duration: 10
				});

				rlimiter.get(function(err, results) {
					console.log(err);
					console.log(results);
				});
			}
		});
	}
});