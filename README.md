# rate-limiter

[![Build Status](https://travis-ci.org/AfterShip/rate-limiter.svg?branch=master)](https://travis-ci.org/AfterShip/rate-limiter)
[![codecov.io](https://codecov.io/github/AfterShip/rate-limiter/coverage.svg?branch=master)](https://codecov.io/github/AfterShip/rate-limiter?branch=master)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FAfterShip%2Frate-limiter.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2FAfterShip%2Frate-limiter?ref=badge_shield)

[![node](https://img.shields.io/node/v/@aftership/rate-limiter.svg)]()
[![npm](https://img.shields.io/npm/v/@aftership/rate-limiter.svg)]()
[![npm](https://img.shields.io/npm/dm/@aftership/rate-limiter.svg)]()


Rate limit for Node.js, with ioredis client

## Installation

```
npm install @aftership/rate-limiter
```

## Dependency
The client must be an instance of `ioredis` library.

## Examples

```javascript
const Limiter = require('@aftership/rate-limiter');
const Redis = require('ioredis');

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

```

## Change log

Please refer to release page


## License
Copyright (c) 2019 AfterShip

Licensed under the MIT license.


[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2FAfterShip%2Frate-limiter.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2FAfterShip%2Frate-limiter?ref=badge_large)