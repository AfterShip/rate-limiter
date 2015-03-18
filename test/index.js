require('should');
var Limiter = require('../lib/');
var redis = require('redis');

var redis_client = redis.createClient();

describe('Limiter', function() {
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
			var limiter = new Limiter({
				limit: 5,
				key: 'something',
				redis_client: redis_client
			});
			limiter.get(function(err, res) {
				res.limit.should.equal(5);
				limiter.get(function(err, res) {
					res.limit.should.equal(5);
					done();
				});
			});
		});
	});

	describe('.remaining', function() {
		it('should return remaining 4, 3, 2', function(done) {
			var limiter = new Limiter({
				limit: 5,
				duration: 100000,
				key: 'something',
				redis_client: redis_client
			});
			limiter.get(function(err, res) {
				res.remaining.should.equal(4);
				limiter.get(function(err, res) {
					res.remaining.should.equal(3);
					limiter.get(function(err, res) {
						res.remaining.should.equal(2);
						done();
					});
				});
			});
		});
	});

	describe('.reset', function() {
		it('should reset after 60000 second', function(done) {
			var limiter = new Limiter({
				limit: 5,
				duration: 60000,
				key: 'something',
				redis_client: redis_client
			});
			limiter.get(function(err, res) {
				res.reset.should.equal(60000);
				done();
			});
		});
	});

	describe('when the limiter is exceeded', function() {
		it('should return .remaining -1', function(done) {
			var limiter = new Limiter({
				limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			limiter.get(function(err, res) {
				res.remaining.should.equal(1);
				limiter.get(function(err, res) {
					res.remaining.should.equal(0);
					limiter.get(function(err, res) {
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

			var limiter = new Limiter({
				duration: 2000,
				limit: 2,
				key: 'something',
				redis_client: redis_client
			});

			limiter.get(function(err, res) {
				res.remaining.should.equal(1);
				limiter.get(function(err, res) {
					res.remaining.should.equal(0);
					setTimeout(function() {
						limiter.get(function(err, res) {
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
		it('the next calls should not create again the limiter in Redis', function(done) {
			var limiter = new Limiter({
				duration: 10000,
				limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			limiter.get(function(err, res) {
				res.remaining.should.equal(1);
			});

			limiter.get(function(err, res) {
				res.remaining.should.equal(0);
				done();
			});
		});
	});

	describe('when trying to decrease before setting value', function() {
		it('should create with ttl when trying to decrease', function(done) {
			var limiter = new Limiter({
				duration: 10000,
				limit: 2,
				key: 'something',
				redis_client: redis_client
			});
			redis_client.setex('limit:something:count', -1, 1, function() {
				limiter.get(function(err, res) {
					res.remaining.should.equal(1);
					limiter.get(function(err, res) {
						res.remaining.should.equal(0);
						limiter.get(function(err, res) {
							res.remaining.should.equal(-1);
							done();
						});
					});
				});
			});
		});
	});

	describe('when multiple concurrent clients modify the limiter', function() {
		var clientsCount = 10,
			limit = 5,
			left = limit - 1,
			limits = [];

		for (var i = 0; i < clientsCount; ++i) {
			limits.push(new Limiter({
				duration: 10000,
				limit: limit,
				key: 'something',
				redis_client: redis.createClient()
			}));
		}

		it('should prevent race condition and properly set the expected value', function(done) {
			var responses = [];

			function callback() {
				responses.push(arguments);

				if (responses.length === clientsCount) {
					// if all the response, the .remaining should have 3, 2, 1, 0, -1 x 6
					// If there were any errors, report.
					var err = responses.some(function(res) {
						return res[0];
					});

					if (err) {
						done(err);
					} else {
						var negative = 0;
						responses.forEach(function(res) {
							if (res[1].remaining < 0) {
								negative++;
							}
						});

						for (var i = left; i < clientsCount; i++) {
							if (i >= left) {
								responses[i][1].remaining.should.equal(-1);
							} else {
								responses[i][1].remaining.should.to.be.above(-1);
							}
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
					res.remaining.should.equal(4);

					// Simulate multiple concurrent requests.
					limits.forEach(function(limiter) {
						limiter.get(callback);
					});
				}
			});
		});
	});
});