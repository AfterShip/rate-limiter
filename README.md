# r3limiter [![Build Status](https://secure.travis-ci.org/AfterShip/r3limiter.png?branch=master)](http://travis-ci.org/AfterShip/r3limiter)

The Real Redis Rate Limiter for Node.js


## Examples
```
var R3Limiter = require('r3limiter');

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

```

## TODO
Add more test case


## Release History
2015-03-17 v0.0.2
Fix example

2015-03-17 v0.0.1
First public release

## License
Copyright (c) 2015 AfterShip  
Licensed under the MIT license.
