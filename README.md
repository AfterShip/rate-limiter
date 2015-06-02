# rlimit [![Build Status](https://secure.travis-ci.org/AfterShip/rlimit.png?branch=master)](http://travis-ci.org/AfterShip/rlimit)

The Real Redis Rate Limiter for Node.js

## npm install

```
npm install rlimit
```


## Examples

```
var Limiter = require('rlimit');

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
				var limiter = new Limiter({
					redis_client: redis_client,
					key: 'the-user-api-key',
					limit: 2, // default is 10
					duration: 10 // default is 60s
				});

				limiter.get(function(err, result) {
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

```

## TODO
Add more test case


## Release History
2015-06-02 v2.0.0
Support Redis Cluster

2015-03-18 v1.0.1
Stable release


## License
Copyright (c) 2015 AfterShip  
Licensed under the MIT license.
