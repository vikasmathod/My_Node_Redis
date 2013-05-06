
function ZsetUtility() {}

ZsetUtility.prototype.basics = function (client, encoding, callback) {
	if (encoding === 'ziplist') {
		client.config('set', 'zset-max-ziplist-entries', 128, function (err, res) {
			if (err) {
				callback(err, null);
			}
			client.config('set', 'zset-max-ziplist-value', 64, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			})
		})
	} else if (encoding === 'skiplist') {
		client.config('set', 'zset-max-ziplist-entries', 0, function (err, res) {
			if (err) {
				callback(err, null);
			}
			client.config('set', 'zset-max-ziplist-value', 0, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			})
		})
	} else {
		callback(new Error('Unknown sorted set encoding'), null);
	}
};
ZsetUtility.prototype.stressers = function (client, encoding, callback) {
	if (encoding === 'ziplist') {
		// Little extra to allow proper fuzzing in the sorting stresser
		client.config('set', 'zset-max-ziplist-entries', 256, function (err, res) {
			if (err) {
				callback(err, null);
			}
			client.config('set', 'zset-max-ziplist-value', 64, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			})
		})
	} else if (encoding === 'skiplist') {
		client.config('set', 'zset-max-ziplist-entries', 0, function (err, res) {
			if (err) {
				callback(err, null);
			}
			client.config('set', 'zset-max-ziplist-value', 0, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			})
		})
	} else {
		callback(new Error('Unknown sorted set encoding'), null);
		// need to exit here. no callback
	}
};
ZsetUtility.prototype.zrange = function (client, args, expected, message, callback) {
	client.zrange(args, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrevrange = function (client, args, expected, message, callback) {
	client.zrevrange(args, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrank = function (client, arg1, arg2, expected, message, callback) {
	client.zrank(arg1, arg2, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrevrank = function (client, arg1, arg2, expected, message, callback) {
	client.zrevrank(arg1, arg2, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrangebyscore = function (client, args, expected, message, callback) {
	client.zrangebyscore(args, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrevrangebyscore = function (client, args, expected, message, callback) {
	client.zrevrangebyscore(args, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};

module.exports = ZsetUtility;