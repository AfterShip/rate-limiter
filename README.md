# rate-limiter

[![Build Status](https://travis-ci.org/AfterShip/rate-limiter.svg?branch=master)](https://travis-ci.org/AfterShip/rate-limiter)
[![codecov.io](https://codecov.io/github/AfterShip/rate-limiter/coverage.svg?branch=master)](https://codecov.io/github/AfterShip/rate-limiter?branch=master)
[![Dependency Status](https://gemnasium.com/AfterShip/rate-limiter.svg)](https://gemnasium.com/AfterShip/rate-limiter)

[![node](https://img.shields.io/node/v/rate-limiter.svg)]()
[![npm](https://img.shields.io/npm/v/rate-limiter.svg)]()
[![npm](https://img.shields.io/npm/dm/rate-limiter.svg)]()
[![npm](https://img.shields.io/npm/l/rate-limiter.svg)]()

![codecov.io](http://codecov.io/github/AfterShip/rate-limiter/branch.svg?branch=master)


Rate limit for Node.js, with ioredis client

## Installation

```
npm install @aftership/rate-limiter
```

## Dependency
The client must be an instance of `ioredis` library.

## Examples

```
var Limiter = require('@aftership/rate-limiter');
var redis = require('ioredis');

var redis_client = redis.createClient({
	host: 'localhost',
	port: 6379,
	db: 0
});

redis_client.on('connect', function(err) {
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

```

## Test

```
npm test

```

## Change log

Please refer to `CHANGELOG.md`


## License
Copyright (c) 2016 AfterShip

Licensed under the MIT license.
