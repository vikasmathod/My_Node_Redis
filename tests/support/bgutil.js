
function BgUtility() {}

BgUtility.prototype.asyncFor = function (start, iterations, func, callback) {
	var index;
	if (start === 'undefined')
		index = 0;
	else
		index = start;
	var done = false;
	var loop = {
		next : function () {
			if (done) {
				return;
			}
			if (iterations > 0) {
				if (index < iterations) {
					index++;
					func(loop);

				} else {
					done = true;
					callback();
				}
			} else {
				func(loop);
			}
		},

		iteration : function () {
			return index - 1;
		},

		decrease : function (val) {
			index = index - val;
		},
		updateindex : function (val) {
			index = val;
		},
		break : function () {
			done = true;
			callback();
		}
	};
	loop.next();
	return loop;
};
BgUtility.prototype.multi_op = function (client, op, start, end, step, keyval, cb) {
	var self = this;
	var key = 0,
	val = 0;
	this.asyncFor(start, end, function (loop) {
		var i = loop.iteration();
		var args = new Array();
		if (keyval[0] == null) {
			key = i;
		} else {
			if (isNaN(keyval[0])) {
				key = keyval[0];
			} else {
				key = i + keyval[0];
			}
		}
		if (Array.isArray(keyval)) {
			for (var j = 1; j < keyval.length; j++) {
				if (op === 'set' || op === 'lset' || op === 'rpush' || op === 'sadd' || op === 'zadd' || op === 'zrem' || op === 'zscore' || op === 'hset' || op === 'hdel') {
					if (keyval[j] == null) {
						args[j - 1] = i;
					} else {
						if (keyval[j] === '*twice*') {
							args[j - 1] = i + i;
						} else if (isNaN(keyval[j])) {
							args[j - 1] = keyval[j];
						} else {
							args[j - 1] = i + keyval[j];
						}
					}
				} else if (op === 'append' || op === 'lrem' || op === 'ltrim' || op === 'zremrangebyscore' || op === 'zincrby' || op === 'hsetnx' || op === 'hmset' || op === 'hincrby') {
					if (keyval[j] == null) {
						args[j - 1] = i;
					} else {
						args[j - 1] = keyval[j];
					}
				} else if (op === 'rename' || op === 'renamenx') {
					if (keyval[j] == null) {
						args[j - 1] = i;
					} else {
						args[j - 1] = i + keyval[j];
					}
				} else {
					args[j - 1] = keyval[j];
				}
			}
		}
		client[op](key, args, function (err, res) {
			if (err) {
				cb(err, null);
			}
			loop.next();
		});
	}, function () {
		cb(null, true);
	});
};

BgUtility.prototype.single_op = function (client, op, start, end, step, keyval, cb) {
	var self = this;
	var key = 0,
	val = 0;
	this.asyncFor(start, end, function (loop) {
		var i = loop.iteration();
		if (keyval[0] == null) {
			key = i;
		} else {
			key = keyval[0];
		}
		client[op](key, function (err, res) {
			if (err) {
				cb(err, null);
			}
			loop.next();
		});
	}, function () {
		cb(null, true);
	});
};

BgUtility.prototype.get_op = function (client, op, start, end, step, keyval, cb) {
	var self = this;
	var key = 0,
	val = 0;
	this.asyncFor(start, end, function (loop) {
		var i = loop.iteration();
		if (keyval[0] == null) {
			key = i;
		} else {
			if (isNaN(keyval[0])) {
				key = keyval[0];
			} else {
				key = i + keyval[0];
			}
		}
		if (keyval[1] == null) {
			val = i;
		} else {
			if (isNaN(keyval[1])) {
				val = keyval[1];
			} else {
				val = i + keyval[1];
			}
		}
		client[op](key, function (err, res) {
			if (err) {
				cb(err, null);
			}
			if (val == res)
				loop.next();
			else
				cb(new Error('Value Not equal (' + val + '==' + res + ')'), null);
		});
	}, function () {
		cb(null, true);
	});
};

BgUtility.prototype.check_op = function (client, op, start, end, step, keyval, cb) {
	var self = this;
	var key = 0,
	val = 0;
	this.asyncFor(start, end, function (loop) {
		var i = loop.iteration();
		if (keyval[0] == null) {
			val = i;
		} else {
			if (keyval[0] === '*twice*') {
				val = i + i;
			} else if (isNaN(keyval[0])) {
				val = keyval[0];
			} else {
				val = i + keyval[0];
			}
		}
		if (keyval[1] == null) {
			key = i;
		} else {
			if (isNaN(keyval[1])) {
				key = keyval[1];
			} else {
				key = i + keyval[1];
			}
		}
		var args = new Array();
		if (Array.isArray(keyval)) {
			for (var j = 2; j < keyval.length; j++) {
				if (keyval[j] == null) {
					args[j - 2] = i;
				} else {
					if (keyval[j] === '*twice*') {
						args[j - 2] = i + i;
					} else if (isNaN(keyval[j])) {
						args[j - 2] = keyval[j];
					} else {
						args[j - 2] = i + keyval[j];
					}
				}
			}
		}
		client[op](key, args, function (err, res) {
			if (err) {
				cb(err, null);
			}
			if (val == res)
				loop.next();
			else
				cb(new Error('Value Not equal (' + val + '==' + res + ')'), null);
		});
	}, function () {
		cb(null, true);
	});
};

BgUtility.prototype.exists_op = function (client, op, start, end, step, keyval, cb) {
	var self = this;
	var key = 0,
	val = 0;
	this.asyncFor(start, end, function (loop) {
		var i = loop.iteration();
		if (keyval[0] == null) {
			key = i;
		} else {}
		if (keyval[1] == null) {
			val = i;
		} else {
			val = keyval[1];
		}
		client[op](key, function (err, res) {
			if (err) {
				cb(err, null);
			}
			if (val == res)
				loop.next();
			else
				cb(new Error('Value Not equal (' + val + '==' + res + ')'), null);
		});
	}, function () {
		cb(null, true);
	});
};
BgUtility.prototype.sismember_op = function (client, op, start, end, step, keyval, cb) {
	var self = this;
	var key = 0,
	val = 0;
	this.asyncFor(start, end, function (loop) {
		var i = loop.iteration();
		if (keyval[0] == null) {
			val = i;
		} else {
			if (keyval[0] === '*twice*') {
				val = i + i;
			} else if (isNaN(keyval[0])) {
				val = keyval[0];
			} else {
				val = keyval[0];
			}
		}
		if (keyval[1] == null) {
			key = i;
		} else {
			if (isNaN(keyval[1])) {
				key = keyval[1];
			} else {
				key = i + keyval[1];
			}
		}
		var args = new Array();
		if (Array.isArray(keyval)) {
			for (var j = 2; j < keyval.length; j++) {
				if (keyval[j] == null) {
					args[j - 2] = i;
				} else {
					if (keyval[j] == '*twice*') {
						args[j - 2] = i + i;
					} else if (isNaN(keyval[j])) {
						args[j - 2] = keyval[j];
					} else {
						args[j - 2] = i + keyval[j];
					}
				}

			}
		}
		client[op](key, args, function (err, res) {
			if (err) {
				cb(err, null);
			}
			if (val == res)
				loop.next();
			else
				cb(new Error('Value Not equal (' + val + '==' + res + ')'), null);
		});
	}, function () {
		cb(null, true);
	});
};
BgUtility.prototype.sismember_op2 = function (client, op, start, end, step, keyval, cb) {
	var self = this;
	this.asyncFor(start, end, function (loop) {
		var i = loop.iteration();
		var vals = new Array();
		if (Array.isArray(keyval[0])) {
			for (var j = 0; j < keyval[0].length; j++) {
				if (keyval[0][j] == null) {
					vals[j] = i;
				} else {
					vals[j] = keyval[0][j];
				}
			}
		}
		var keys = new Array();
		if (Array.isArray(keyval[1])) {
			for (var j = 0; j < keyval[1].length; j++) {
				if (keyval[1][j] == null) {
					keys[j] = i;
				} else {
					keys[j] = keyval[1][j];
				}
			}
		}
		var args = new Array();
		if (Array.isArray(keyval[2])) {
			for (var j = 0; j < keyval[2].length; j++) {
				if (keyval[2][j] == null) {
					args[j] = i;
				} else {
					if (keyval[2][j] == '*twice*') {
						args[j] = i + i;
					} else if (isNaN(keyval[2][j])) {
						args[j] = keyval[2][j];
					} else {
						args[j] = i + keyval[2][j];
					}
				}

			}
		}
		client[op](keys[0], args[0], function (err, res0) {
			if (err) {
				cb(err, null);
			}
			if (vals[0] == res0) {
				client[op](keys[1], args[1], function (err, res1) {
					if (err) {
						cb(err, null);
					}
					if (vals[1] == res1) {
						loop.next();
					} else
						cb(new Error('Value Not equal (' + vals[1] + '==' + res1 + ')'), null);
				});
			} else
				cb(new Error('Value Not equal (' + vals[0] + '==' + res0 + ')'), null);
		});
	}, function () {
		cb(null, true);
	});
};

BgUtility.prototype.mset_loop = function (client, iter1, iter2, cb) {
	var self = this;
	this.asyncFor(0, iter1, function (loop) {
		var i = loop.iteration();
		var args = new Array();
		for (var j = 0; j < iter2; j++) {
			args.push(i);
			args.push('abcdefghij');
			i += 1;
		}
		loop.updateindex(i);
		//loop.updatecounter(i);
		client.mset(args, function (err, res) {
			if (err) {
				cb(err, null);
			}
			loop.next();
		});
	}, function () {
		cb(null, true);
	});
};
BgUtility.prototype.rpush_loop = function (client, key, iter1, iter2, cb) {
	var self = this;
	this.asyncFor(0, iter1, function (loop) {
		var i = loop.iteration();
		var args = new Array();
		for (var j = 0; j < iter2; j++) {
			args.push('abcdefghij');
			i += 1;
		}
		loop.updateindex(i);
		//loop.updatecounter(i);
		client.rpush(key, args, function (err, res) {
			if (err) {
				cb(err, null);
			}
			loop.next();
		});
	}, function () {
		cb(null, true);
	});
};
BgUtility.prototype.hmset_loop = function (client, key, iter1, iter2, cb) {
	var self = this;
	this.asyncFor(0, iter1, function (loop) {
		var i = loop.iteration();
		var args = new Array();
		for (var j = 0; j < iter2; j++) {
			args.push(i);
			args.push('abcdefghij');
			i += 1;
		}
		loop.updateindex(i);
		//loop.updatecounter(i);
		client.hmset(key, args, function (err, res) {
			if (err) {
				cb(err, null);
			}
			loop.next();
		});
	}, function () {
		cb(null, true);
	});
};
BgUtility.prototype.sadd_loop = function (client, key, iter1, iter2, cb) {
	var self = this;
	this.asyncFor(0, iter1, function (loop) {
		var i = loop.iteration();
		var args = new Array();
		for (var j = 0; j < iter2; j++) {
			args.push(i);
			i += 1;
		}
		loop.updateindex(i);
		//loop.updatecounter(i);
		client.sadd(key, args, function (err, res) {
			if (err) {
				cb(err, null);
			}
			loop.next();
		});
	}, function () {
		cb(null, true);
	});
};
BgUtility.prototype.zadd_loop = function (client, key, iter1, iter2, cb) {
	var self = this;
	this.asyncFor(0, iter1, function (loop) {
		var i = loop.iteration();
		var args = new Array();
		for (var j = 0; j < iter2; j++) {
			args.push(i);
			args.push(i);
			i += 1;
		}
		loop.updateindex(i);
		//loop.updatecounter(i);
		client.zadd(key, args, function (err, res) {
			if (err) {
				cb(err, null);
			}
			loop.next();
		});
	}, function () {
		cb(null, true);
	});
};
module.exports = BgUtility;