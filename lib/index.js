/*
 * r3limiter
 * https://github.com/AfterShip/r3limiter
 *
 * Copyright (c) 2015 AfterShip
 * Licensed under the MIT license.
 */

(function() {
	'use strict';

	var fs = require('fs');

	/**
	 * R3Limiter constructor
	 * options:
	 * {
	 * 	redis_client: redis connection client instance
	 * 	key: key of the limiter
	 * 	limit: rate limit within duration
	 * 	duration: within this period (second), number of 'limit' tokens can be used
	 * }
	 *
	 * @param options {Object} - option parameters
	 * @constructor
	 */
	function R3Limiter(options) {
		this.redis_client = options.redis_client;
		this.key = options.key ? 'limit:' + options.key : 'limit:';
		this.limit = options.limit || 10;
		this.duration = options.duration || 60;

		this._lua_string = fs.readFileSync(__dirname + '/lua/get_token.lua').toString();
		this._lua_sha1 = null;

	}

	/**
	 * get 1 token
	 * callback:
	 *    err: errors
	 *    result: {
	 * 		limit: rate limit within duration,
	 *		remaining: number of token remaining,
	 *		reset: seconds left to reset the rate
	 * 	}
	 * @param callback {function(Object, Object=)} - finish callback
	 */
	R3Limiter.prototype.get = function(callback) {

		var _this = this;

		if (this._lua_sha1) {
			this._executeFunction(callback);
		} else {
			this.redis_client.script('load', this._lua_string, function(err, sha1) {
				_this._lua_sha1 = sha1;
				_this._executeFunction(callback);
			});
		}
	};


	/**
	 * A helper for getting token and fire the callback
	 * if rate limit reached, it will try to get token again until token available.
	 * callback:
	 *    err: error
	 * @param callback {function(Object=)} - finish callback
	 */
	R3Limiter.prototype.run = function(callback) {
		var _this = this;
		this.get(function(err, result) {
			if (err || !result) {
				callback(err);
			} else {
				if (result.remaining === -1) {
					setTimeout(function(){
						_this.run(callback);
					}, 1000 * (result.reset + 1));
				} else {
					callback();
				}
			}
		});
	};

	/**
	 * execute lua function
	 * @param callback
	 * @private
	 */
	R3Limiter.prototype._executeFunction = function(callback) {

		var _this = this;

		this.redis_client.evalsha(this._lua_sha1, 1, this.key, this.limit, this.duration, function(err, result) {
			if (err) {
				callback(err);
			} else {
				var error = null;
				try {
					result = JSON.parse(result);
					result = {
						limit: _this.limit,
						remaining: result[0],
						reset: parseInt(result[1])
					};
				} catch (e) {
					error = 'limiter_json_error';
					result = null;
				}

				callback(error, result);
			}
		});
	};

	module.exports = R3Limiter;
})();
