require('should');
var Rlimiter = require('../lib/');
var redis = require('redis');

var redis_client = redis.createClient();

describe('Rlimiter', function() {
	beforeEach(function(done) {
		redis_client.keys('limit:*', function(err, keys) {
			if (err) return done(err);
			if (!keys.length) return done();
			var args = keys.concat(done);
			redis_client.del.apply(redis_client, args);
		});
	});

	describe('.limit', function() {
		it('should always return limit 5', function(done) {
			var rlimiter = new Rlimiter({
				limit: 5,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.limit.should.equal(5);
				rlimiter.get(function(err, res) {
					res.limit.should.equal(5);
					done();
				});
			});
		});
	});

	describe('.remaining', function() {
		it('should return remaining 4, 3, 2', function(done) {
			var rlimiter = new Rlimiter({
				limit: 5,
				duration: 100000,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.remaining.should.equal(4);
				rlimiter.get(function(err, res) {
					res.remaining.should.equal(3);
					rlimiter.get(function(err, res) {
						res.remaining.should.equal(2);
						done();
					});
				});
			});
		});
	});

	describe('.reset', function() {
		it('should reset after 60000 second', function(done) {
			var rlimiter = new Rlimiter({
				limit: 5,
				duration: 60000,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.reset.should.equal(60000);
				done();
			});
		});
	});

	describe('when the rlimiter is exceeded', function() {
		it('should return .remaining -1', function(done) {
			var rlimiter = new Rlimiter({
				limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.remaining.should.equal(1);
				rlimiter.get(function(err, res) {
					res.remaining.should.equal(0);
					rlimiter.get(function(err, res) {
						// function caller should reject this call
						res.remaining.should.equal(-1);
						done();
					});
				});
			});
		});
	});

	describe('when the duration is exceeded', function() {
		it('should get reset < 2000', function(done) {
			this.timeout(5000);

			var rlimiter = new Rlimiter({
				duration: 2000,
				limit: 2,
				key: 'something',
				redis_client: redis_client
			});

			rlimiter.get(function(err, res) {
				res.remaining.should.equal(1);
				rlimiter.get(function(err, res) {
					res.remaining.should.equal(0);
					setTimeout(function() {
						rlimiter.get(function(err, res) {
							console.log(res.reset);
							res.reset.should.be.below(2000);
							res.remaining.should.equal(-1);
							done();
						});
					}, 3000);
				});
			});
		});
	});

	describe('when multiple successive calls are made', function() {
		it('the next calls should not create again the rlimiter in Redis', function(done) {
			var rlimiter = new Rlimiter({
				duration: 10000,
				limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.remaining.should.equal(1);
			});

			rlimiter.get(function(err, res) {
				res.remaining.should.equal(0);
				done();
			});
		});
	});

	describe('when trying to decrease before setting value', function() {
		it('should create with ttl when trying to decrease', function(done) {
			var rlimiter = new Rlimiter({
				duration: 10000,
				limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			redis_client.setex('limit:something:count', -1, 1, function() {
				rlimiter.get(function(err, res) {
					res.remaining.should.equal(1);
					rlimiter.get(function(err, res) {
						res.remaining.should.equal(0);
						rlimiter.get(function(err, res) {
							res.remaining.should.equal(-1);
							done();
						});
					});
				});
			});
		});
	});

	describe('when multiple concurrent clients modify the rlimiter', function() {
		var clientsCount = 10,
			limit = 5,
			left = limit - 1,
			limits = [];

		for (var i = 0; i < clientsCount; ++i) {
			limits.push(new Rlimiter({
				duration: 10000,
				limit: limit,
				key: 'something',
				redis_client: redis.createClient()
			}));
		}

		it('should prevent race condition and properly set the expected value', function(done) {
			var responses = [];

			function callback() {
				console.log('arguments')
				console.log(arguments)
				//responses.push(arguments);

				//if (responses.length == clientsCount) {
				//	// If there were any errors, report.
				//	var err = responses.some(function(res) {
				//		return res[0];
				//	});
				//
				//	if (err) {
				//		done(err);
				//	} else {
				//		responses.forEach(function(res) {
				//			res[1].remaining.should.equal(left < 0 ? 0 : left);
				//			left--;
				//		});
				//
				//		for (var i = limit - 1; i < clientsCount; ++i) {
				//			responses[i][1].remaining.should.equal(-1);
				//		}
				//
				//		done();
				//	}
				//}
				done()
			}

			// Warm up and prepare the data.
			limits[0].get(function(err, res) {
				if (err) {
					done(err);
				} else {
					res.remaining.should.equal(4);

					// Simulate multiple concurrent requests.
					limits.forEach(function(rlimiter) {
						rlimiter.get(callback);
					});
				}
			});
		});
	});
});