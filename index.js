/*
 * rlimiter
 * https://github.com/AfterShip/rlimiter
 *
 * Copyright (c) 2015 AfterShip
 * Licensed under the MIT license.
 */

(function() {
	'use strict';

	var fs = require('fs');


	/**
	 * Limiter constructor
	 * options:
	 * {
	 * 	redis_client: redis connection client instance
	 * 	key: key of the limiter
	 * 	rate_limit: rate limit within duration
	 * 	duration: within this period (second), number of 'rate_limit' tokens can be used
	 * }
	 *
	 * @param options {Object} - option parameters
	 * @constructor
	 */
	function Limiter(options) {

		this.redis_client = options.redis_client;
		this.key = options.key || '';
		this.rate_limit = options.rate_limit || 10;
		this.duration = options.duration || 60;

		this._function_string = fs.readFileSync(__dirname + '/lua/get_token.lua').toString();
		this._function_sha1 = null;

		this.key = 'limit:' + this.key;
	}

	/**
	 * get token
	 * @param callback {function(Object, Object=)} - callback
	 */
	Limiter.prototype.get = function(callback) {

		var _this = this;

		if (this._function_sha1) {
			this.executeFunction(callback);
		} else {
			this.redis_client.script('load', this._function_string, function(err, sha1) {
				_this._function_sha1 = sha1;
				_this.executeFunction(callback);
			});
		}
	};

	/**
	 *
	 * @param callback
	 */
	Limiter.prototype.executeFunction = function(callback) {

		var _this = this;

		this.redis_client.evalsha(this._function_sha1, 3, this.key, this.rate_limit, this.duration, function(err, result) {
			if (err) {
				callback(err);
			} else {
				try {
					result = JSON.parse(result);
					result = {
						total: _this.rate_limit,
						remain: result[0],
						seconds_left: parseInt(result[1])
					};
				} catch (e) {
					result = null;
				}

				callback(null, result);
			}
		});
	};

	module.exports = Limiter;
})();
