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
	 * R3 constructor
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
	function R3(options) {
		this.redis_client = options.redis_client;
		this.key = options.key ? 'limit:' + options.key : 'limit:';
		this.limit = options.limit || 10;
		this.duration = options.duration || 60;

		this._lua_string = fs.readFileSync(__dirname + '/lua/get_token.lua').toString();
		this._lua_sha1 = null;

	}

	/**
	 * get token
	 * @param callback {function(Object, Object=)} - callback
	 */
	R3.prototype.get = function(callback) {

		var _this = this;

		if (this._lua_sha1) {
			this.executeFunction(callback);
		} else {
			this.redis_client.script('load', this._lua_string, function(err, sha1) {
				_this._lua_sha1 = sha1;
				_this.executeFunction(callback);
			});
		}
	};

	/**
	 *
	 * @param callback
	 */
	R3.prototype.executeFunction = function(callback) {

		var _this = this;

		this.redis_client.evalsha(this._lua_sha1, 3, this.key, this.limit, this.duration, function(err, result) {
			if (err) {
				callback(err);
			} else {
				try {
					result = JSON.parse(result);
					result = {
						limit: _this.limit,
						remaining: result[0],
						reset: parseInt(result[1])
					};
				} catch (e) {
					result = null;
				}

				callback(null, result);
			}
		});
	};

	module.exports = R3;
})();
