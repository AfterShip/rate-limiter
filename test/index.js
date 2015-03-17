require('should');
var Rlimiter = require('..');
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

	describe('.total', function() {
		it('should represent the total 5 request per rate limit period', function(done) {
			var rlimiter = new Rlimiter({
				rate_limit: 5,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.total.should.equal(5);
				rlimiter.get(function(err, res) {
					res.total.should.equal(5);
					done();
				});
			});
		});
	});

	describe('.remain', function() {
		it('should represent the number of requests remain in the 100000s period', function(done) {
			var rlimiter = new Rlimiter({
				rate_limit: 5,
				duration: 100000,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.remain.should.equal(4);
				rlimiter.get(function(err, res) {
					res.remain.should.equal(3);
					rlimiter.get(function(err, res) {
						res.remain.should.equal(2);
						done();
					});
				});
			});
		});
	});

	describe('.seconds_left', function() {
		it('should represent after x second will reset', function(done) {
			var rlimiter = new Rlimiter({
				rate_limit: 5,
				duration: 60000,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				var left = res.seconds_left - (Date.now() / 1000);
				left.should.be.below(60);
				done();
			});
		});
	});

	describe('when the rlimiter is exceeded', function() {
		it('should retain .remain at 0', function(done) {
			var rlimiter = new Rlimiter({
				rate_limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.remain.should.equal(1);
				rlimiter.get(function(err, res) {
					res.remain.should.equal(0);
					rlimiter.get(function(err, res) {
						// function caller should reject this call
						res.remain.should.equal(-1);
						done();
					});
				});
			});
		});
	});

	describe('when the duration is exceeded', function() {
		it('should seconds_left', function(done) {
			this.timeout(5000);

			var rlimiter = new Rlimiter({
				duration: 2000,
				rate_limit: 2,
				key: 'something',
				redis_client: redis_client
			});

			rlimiter.get(function(err, res) {
				res.remain.should.equal(1);
				rlimiter.get(function(err, res) {
					res.remain.should.equal(0);
					setTimeout(function() {
						rlimiter.get(function(err, res) {
							res.seconds_left.should.be.below(2000);
							res.remain.should.equal(-1);
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
				rate_limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			rlimiter.get(function(err, res) {
				res.remain.should.equal(1);
			});

			rlimiter.get(function(err, res) {
				res.remain.should.equal(0);
				done();
			});
		});
	});

	describe('when trying to decrease before setting value', function() {
		it('should create with ttl when trying to decrease', function(done) {
			var rlimiter = new Rlimiter({
				duration: 10000,
				rate_limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			redis_client.setex('limit:something:count', -1, 1, function() {
				rlimiter.get(function(err, res) {
					res.remain.should.equal(1);
					rlimiter.get(function(err, res) {
						res.remain.should.equal(0);
						rlimiter.get(function(err, res) {
							res.remain.should.equal(-1);
							done();
						});
					});
				});
			});
		});
	});

	describe('when multiple concurrent clients modify the rlimiter', function() {
		var clientsCount = 7,
			rate_limit = 5,
			left = rate_limit - 1,
			limits = [];

		for (var i = 0; i < clientsCount; ++i) {
			limits.push(new Rlimiter({
				duration: 10000,
				rate_limit: rate_limit,
				key: 'something',
				redis_client: redis.createClient()
			}));
		}

		it('should prevent race condition and properly set the expected value', function(done) {
			var responses = [];

			function complete() {
				console.log('arguments')
				console.log(arguments)
				responses.push(arguments);

				if (responses.length == clientsCount) {
					// If there were any errors, report.
					var err = responses.some(function(res) {
						return res[0];
					});

					if (err) {
						done(err);
					} else {
						responses.forEach(function(res) {
							res[1].remain.should.equal(left < 0 ? 0 : left);
							left--;
						});

						for (var i = rate_limit - 1; i < clientsCount; ++i) {
							responses[i][1].remain.should.equal(-1);
						}

						done();
					}
				}
			}

			// Warm up and prepare the data.
			limits[0].get(function(err, res) {
				if (err) {
					done(err);
				} else {
					res.remain.should.equal(left--);

					// Simulate multiple concurrent requests.
					limits.forEach(function(rlimiter) {
						rlimiter.get(complete);
					});
				}
			});
		});
	});
});