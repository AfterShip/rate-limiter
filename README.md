# rlimiter [![Build Status](https://secure.travis-ci.org/AfterShip/rlimiter.png?branch=master)](http://travis-ci.org/AfterShip/rlimiter)

The redis rate limiter for node.js

## Getting Started
_(Coming soon)_

## Documentation
_(Coming soon)_

## Examples
```
var Rlimiter = require('rlimiter');

var redis = require('redis');
var redis_client = redis.createClient(6379, 'localhost');

redis_client.on('connect', function(err) {
	if (err) {
		console.log(err);
	} else {
		redis_client.select(3, function(err) {
			if (err) {
				console.log(err);
			} else {
				// limit to 2 request per every 10s
				var rlimiter = new Rlimiter({
					redis_client: redis_client,
					key: 'the-user-api-key',
					rate_limit: 2,
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

```


## Release History
2015-03-17 v0.0.1
First public release

## License
Copyright (c) 2015 AfterShip  
Licensed under the MIT license.
