# rlimiter [![Build Status](https://secure.travis-ci.org/AfterShip/rlimiter.png?branch=master)](http://travis-ci.org/AfterShip/rlimiter)

The redis rate limiter for node.js

## Getting Started
_(Coming soon)_

## Documentation
_(Coming soon)_

## Examples
```
var Rlimiter = require('../lib/index');

var redis = require('redis');
var redis_client = redis.createClient();
redis_client.on('connect', function(err) {
	redis_client.select(3, function(err) {

		var rlimiter = new Rlimiter({
			redis_client: redis_client,
			key: 'usps',
			rate_limit: 2,
			duration: 10
		});

		rlimiter.get(function(err, results) {

			console.log(err);
			console.log(results);
		});

	});
});

```


## Release History
2015-03-17 v0.0.1
First public release

## License
Copyright (c) 2015 AfterShip  
Licensed under the MIT license.
