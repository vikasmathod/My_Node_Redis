exports.Scripting = (function () {
	// private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	server1 = new Server(),
	server2 = new Server(),
	scripting = {},
	name = "Scripting",
	client = "",
	tester = {},
	server_pid = "",
	all_tests = "",
	server_host = "",
	server_port = "",
	client_pid = "";

	//public property
	scripting.debug_mode = false;

	scripting.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = "scripting";
			var overrides = {};
			var args = {};
			args['name'] = name;
			args['tags'] = tags;
			args['overrides'] = overrides;
			server.start_server(client_pid, args, function (err, res) {
				if (err) {
					callback(err, null);
				}
				server_pid = res;
				client = g.srv[client_pid][server_pid]['client'];
				server_host = g.srv[client_pid][server_pid]['host'];
				server_port = g.srv[client_pid][server_pid]['port'];
				all_tests = Object.keys(tester);

				testEmitter.emit('next');
			});
		});
		testEmitter.on('end', function () {
			server.kill_server(client_pid, server_pid, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			});
		});
		testEmitter.on('next', function () {
			var test_case_name = all_tests.shift()
				if (test_case_name) {
					tester[test_case_name](function (error) {
						ut.fail(error);
						testEmitter.emit('next');
					});
				} else {
					client.end();
					if (scripting.debug_mode) {
						log.notice(name + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		if (scripting.debug_mode) {
			server.set_debug_mode(true);
		}
		testEmitter.emit('start');
	}

	tester.scripting1 = function (errorCallback) {
		var test_case = "EVAL - Does Lua interpreter replies to our requests?";
		client.eval("return 'hello'", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'hello', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting2 = function (errorCallback) {
		var test_case = "EVAL - Lua integer -> Redis protocol type conversion";
		client.eval("return 100.5", 0, function (err, res) {
			try {
				if (!assert.equal(res, '100', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting3 = function (errorCallback) {
		var test_case = "EVAL - Lua string -> Redis protocol type conversion";
		client.eval("return 'hello world'", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'hello world', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting4 = function (errorCallback) {
		var test_case = "EVAL - Lua true boolean -> Redis protocol type conversion";
		client.eval("return true", 0, function (err, res) {
			try {
				if (!assert.equal(res, '1', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting5 = function (errorCallback) {
		var test_case = "EVAL - Lua false boolean -> Redis protocol type conversion";
		client.eval("return false", 0, function (err, res) {
			try {
				if (!assert.equal(res, null, test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting6 = function (errorCallback) {
		var test_case = "EVAL - Lua status code reply -> Redis protocol type conversion";
		client.eval("return {ok='fine'}", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'fine', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting7 = function (errorCallback) {
		var test_case = "EVAL - Lua error reply -> Redis protocol type conversion";
		client.eval("return {err='this is an error'}", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('this is an error', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting8 = function (errorCallback) {
		var test_case = "EVAL - Lua table -> Redis protocol type conversion";
		client.eval("return {1,2,3,'ciao',{1,2}}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, [1, 2, 3, 'ciao', [1, 2]], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting9 = function (errorCallback) {
		var test_case = "EVAL - Are the KEYS and ARGS arrays populated correctly?";
		client.eval("return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}", 2, 'a', 'b', 'c', 'd', function (err, res) {
			try {
				if (!assert.deepEqual(res, ['a', 'b', 'c', 'd'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting10 = function (errorCallback) {
		var test_case = "EVAL - is Lua able to call Redis API?";
		client.set('mykey', 'myval');
		client.eval("return redis.call('get','mykey')", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'myval', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting11 = function (errorCallback) {
		var test_case = "EVALSHA - Can we call a SHA1 if already defined?";
		client.evalsha("9bd632c7d33e571e9f24556ebed26c3479a87129", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'myval', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting12 = function (errorCallback) {
		var test_case = "EVALSHA - Can we call a SHA1 in uppercase?";
		client.evalsha("9BD632C7D33E571E9F24556EBED26C3479A87129", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'myval', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting13 = function (errorCallback) {
		var test_case = "EVALSHA - Do we get an error on invalid SHA1?";
		client.evalsha("NotValidShaSUM", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('NOSCRIPT', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting14 = function (errorCallback) {
		var test_case = "EVALSHA - Do we get an error on non defined SHA1?";
		client.evalsha("ffd632c7d33e571e9f24556ebed26c3479a87130", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('NOSCRIPT', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting15 = function (errorCallback) {
		var test_case = "EVAL - Redis integer -> Lua type conversion";
		client.eval("local foo = redis.pcall('incr','x') return {type(foo),foo}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['number', 1], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting16 = function (errorCallback) {
		var test_case = "EVAL - Redis bulk -> Lua type conversion";
		client.set('mykey', 'myval');
		client.eval("local foo = redis.pcall('get','mykey') return {type(foo),foo}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['string', 'myval'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting17 = function (errorCallback) {
		var test_case = "EVAL - Redis multi bulk -> Lua type conversion";
		client.del('mylist');
		client.rpush('mylist', 'a');
		client.rpush('mylist', 'b');
		client.rpush('mylist', 'c');
		client.eval("local foo = redis.pcall('lrange','mylist',0,-1) return {type(foo),foo[1],foo[2],foo[3],# foo}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['table', 'a', 'b', 'c', 3], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting18 = function (errorCallback) {
		var test_case = "EVAL - Redis status reply -> Lua type conversion";

		client.eval("local foo = redis.pcall('set','mykey','myval') return {type(foo),foo['ok']}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['table', 'OK'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting19 = function (errorCallback) {
		var test_case = "EVAL - Redis error reply -> Lua type conversion";
		client.set('mykey', 'myval');
		client.eval("local foo = redis.pcall('incr','mykey') return {type(foo),foo['err']}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['table', 'ERR value is not an integer or out of range'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting20 = function (errorCallback) {
		var test_case = "EVAL - Redis nil bulk reply -> Lua type conversion";
		client.del('mykey');
		client.eval("local foo = redis.pcall('get','mykey') return {type(foo),foo == false}", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['boolean', 1], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting21 = function (errorCallback) {
		var test_case = "EVAL - Is Lua affecting the currently selected DB?";
		client.set('mykey', "this is DB 0");
		client.select(10);
		client.set('mykey', "this is DB 10");
		client.eval("return redis.pcall('get','mykey')", 0, function (err, res) {
			try {
				if (!assert.equal(res, 'this is DB 10', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting22 = function (errorCallback) {
		var test_case = "EVAL - Is Lua seleced DB retained?";

		client.eval("return redis.pcall('select','0')", 0, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.get('mykey', function (err, res) {
				try {
					if (!assert.equal(res, 'this is DB 0', test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	if (0) {
		tester.scripting23 = function (errorCallback) {
			var test_case = "EVAL - Script can't run more than configured time limit";
			client.config('set', 'lua-time-limit', 1, function (err, res) {

				client.eval("local i = 0 while false do i=i+1 end", 0, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					try {
						if (!assert.equal(err, 'this is DB 0', test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');

				});
			});
		}
	}

	tester.scripting24 = function (errorCallback) {
		var test_case = "EVAL - Scripts can't run certain commands";

		client.eval("return redis.pcall('spop','x')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('not allowed', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting25 = function (errorCallback) {
		var test_case = "EVAL - Scripts can't run certain commands";

		client.eval("redis.pcall('randomkey'); return redis.pcall('set','x','ciao')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('not allowed after', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting26 = function (errorCallback) {
		var test_case = "EVAL - No arguments to redis.call/pcall is considered an error";

		client.eval("return redis.call()", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('one argument', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting27 = function (errorCallback) {
		var test_case = "EVAL - redis.call variant raises a Lua error on Redis cmd error (1)";

		client.eval("redis.call('nosuchcommand')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('Unknown Redis', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting28 = function (errorCallback) {
		var test_case = "EVAL - redis.call variant raises a Lua error on Redis cmd error (1)";

		client.eval("redis.call('get','a','b','c')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('number of args', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting29 = function (errorCallback) {
		var test_case = "EVAL - redis.call variant raises a Lua error on Redis cmd error (1)";
		client.set('foo', 'bar');
		client.eval("redis.call('lpush','foo','val')", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('against a key', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting30 = function (errorCallback) {
		var test_case = "SCRIPTING FLUSH - is able to clear the scripts cache?";
		client.set('mykey', 'myval');

		client.evalsha("9bd632c7d33e571e9f24556ebed26c3479a87129", 0, function (err, res_v) {
			if (res_v == "myval") {
				client.multi([['script', 'flush']]).exec(function (err, res) {
					if (err) {
						errorCallback(err)
					}
					client.evalsha("9bd632c7d33e571e9f24556ebed26c3479a87129", 0, function (err, res_e) {
						try {
							if (!assert.ok(ut.match('NOSCRIPT', err), test_case))
								ut.pass(test_case);
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			} else {
				ut.fail("expected: " + res_v + " Actual: myval", true);
				testEmitter.emit('next');
			}

		});
	}

	tester.scripting31 = function (errorCallback) {
		var test_case = "SCRIPT EXISTS - can detect already defined scripts?";
		client.eval("return 1+1", 0, function (err, res) {
			if (err) {
				errorCallback(err)
			}
			client.multi([['script', 'exists', 'a27e7e8a43702b7046d4f6a7ccf5b60cef6b9bd9', 'a27e7e8a43702b7046d4f6a7ccf5b60cef6b9bda']]).exec(function (err, res) {
				try {
					if (!assert.deepEqual(res, [[1, 0]], test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting32 = function (errorCallback) {
		var test_case = "SCRIPT LOAD - is able to register scripts in the scripting cache";
		var res_array = [];
		client.multi([['script', 'load', "return 'loaded'"]]).exec(function (err, res) {
			if (err) {
				errorCallback(err)
			}
			res_array.push(res);
			client.evalsha("b534286061d4b9e4026607613b95c06c06015ae8", 0, function (err, res) {
				res_array.push(res);
				try {
					if (!assert.deepEqual(res_array, [["b534286061d4b9e4026607613b95c06c06015ae8"], "loaded"], test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting33 = function (errorCallback) {
		var test_case = "In the context of Lua the output of random commands gets ordered";
		client.del('myset');
		client.sadd('myset', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'z', 'aa', 'aaa', 'azz');
		client.eval("return redis.call('smembers','myset')", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['a', 'aa', 'aaa', 'azz', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'z'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting34 = function (errorCallback) {
		var test_case = "SORT is normally not alpha re-ordered for the scripting engine";
		client.del('myset');
		client.sadd('myset', 1, 2, 3, 4, 10);
		client.eval("return redis.call('sort','myset','desc')", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, [10, 4, 3, 2, 1], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting35 = function (errorCallback) {
		var test_case = "SORT BY <constant> output gets ordered for scripting";
		client.del('myset');
		client.sadd('myset', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'z', 'aa', 'aaa', 'azz');
		client.eval("return redis.call('sort','myset','by','_')", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['a', 'aa', 'aaa', 'azz', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'z'], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting36 = function (errorCallback) {
		var test_case = "SORT BY <constant> with GET gets ordered for scripting";
		client.del('myset');
		client.sadd('myset', 'a', 'b', 'c');
		client.eval("return redis.call('sort','myset','by','_','get','#','get','_:*')", 0, function (err, res) {
			try {
				if (!assert.deepEqual(res, ['a', null, 'b', null, 'c', null], test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting37 = function (errorCallback) {
		var test_case = "redis.sha1hex() implementation";
		var res_array = [];
		client.eval("return redis.sha1hex('')", 0, function (err, res) {
			if (err) {
				errorCallback(err)
			}
			res_array.push(res);
			client.eval("return redis.sha1hex('Pizza & Mandolino')", 0, function (err, res) {
				if (err) {
					errorCallback(err)
				}
				res_array.push(res);
				try {
					if (!assert.deepEqual(res_array, ['da39a3ee5e6b4b0d3255bfef95601890afd80709', '74822d82031af7493c20eefa13bd07ec4fada82f'], test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	}

	tester.scripting38 = function (errorCallback) {
		var test_case = "Globals protection reading an undeclared global variable";

		client.eval("return a", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('attempted to access unexisting global', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting39 = function (errorCallback) {
		var test_case = "Globals protection setting an undeclared global*";

		client.eval("a=10", 0, function (err, res) {
			try {
				if (!assert.ok(ut.match('attempted to create global', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.scripting40 = function (errorCallback) {
		var test_case = "Test an example script DECR_IF_GT";
		var script = '\
														local current \
														current = redis.call("get",KEYS[1]) \
														if not current then return nil end \
														if current > ARGV[1] then \
															return redis.call("decr",KEYS[1]) \
														else \
															return redis.call("get",KEYS[1]) \
														end';
		client.set('foo', 5);
		var result = "";
		client.eval(script, 1, 'foo', 2, function (err, res) {
			if (err) {
				errorCallback(err)
			}
			result += res;
			client.eval(script, 1, 'foo', 2, function (err, res) {
				if (err) {
					errorCallback(err)
				}
				result += res;
				client.eval(script, 1, 'foo', 2, function (err, res) {
					if (err) {
						errorCallback(err)
					}
					result += res;
					client.eval(script, 1, 'foo', 2, function (err, res) {
						if (err) {
							errorCallback(err)
						}
						result += res;
						client.eval(script, 1, 'foo', 2, function (err, res) {
							if (err) {
								errorCallback(err)
							}
							result += res;
							try {
								if (!assert.equal(result, 43222, test_case))
									ut.pass(test_case);
							} catch (e) {
								ut.fail(e, true);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	}

	tester.scripting41 = function (errorCallback) {
		var test_case = "Scripting engine resets PRNG at every script execution";
		client.eval("return tostring(math.random())", 0, function (err, res1) {
			if (err) {
				errorCallback(err)
			}
			client.eval("return tostring(math.random())", 0, function (err, res2) {
				if (err) {
					errorCallback(err)
				}
				try {
					if (!assert.equal(res1, res2, test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});

	}

	tester.scripting42 = function (errorCallback) {
		var test_case = "Scripting engine PRNG can be seeded correctly";
		client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 10, function (err, res1) {
			if (err) {
				errorCallback(err)
			}
			client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 10, function (err, res2) {
				if (err) {
					errorCallback(err)
				}
				client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 20, function (err, res3) {
					if (err) {
						errorCallback(err)
					}
					try {
						if (!assert.equal(res1, res2, test_case) && !assert.notEqual(res2, res3, test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});

	} 

	tester.scripting43 = function (errorCallback) {
		var test_case = "Scripting engine PRNG can be seeded correctly";
		client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 10, function (err, res1) {
			if (err) {
				errorCallback(err)
			}
			client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 10, function (err, res2) {
				if (err) {
					errorCallback(err)
				}
				client.eval("math.randomseed(ARGV[1]); return tostring(math.random())", 0, 20, function (err, res3) {
					if (err) {
						errorCallback(err)
					}
					try {
						if (!assert.equal(res1, res2, test_case) && !assert.notEqual(res2, res3, test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});

	}

	tester.scripting45 = function (errorCallback) {
		//Test that the server can be started using the truncated AOF.
		var args = {};
		args['name'] = name;
		args['tags'] = 'scripting-repl';
		args['overrides'] = {};
		var server_host2 = '',
		server_port2 = '',
		server_pid2 = '';
		server2.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			server_pid2 = res;
			client2 = g.srv[client_pid][server_pid2]['client'];
			server_host2 = g.srv[client_pid][server_pid2]['host'];
			server_port2 = g.srv[client_pid][server_pid2]['port'];
			start_actual_test(function (err, res) {
				if (err) {
					errorCallback(err);
				}
				kill_server(function (err, res) {
					if (err) {
						errorCallback(err)
					}
					testEmitter.emit('next');
				});
			});
		});
		function kill_server(callback) {
			server2.kill_server(client_pid, server_pid2, function (err, res) {
				if (err) {
					callback(err, null);
				} 
			});
		};
		function start_actual_test(callback){
			async.series({
				one:function(){
					var test_case = "Before the slave connects we issue two EVAL commands";
					client2.eval("redis.call('incr','x'); redis.call('nonexisting')",0,function(err,res){
						client2.eval("return redis.call('incr','x')",0,function(err,res){
							try{
								if(!assert.equal(res,2,test_case))
								ut.pass(test_case);
								}catch(e){
								ut.fail(e,true);
							}
							callback(null,false);
						});
					});
				},
				two:function(){
					var test_case = "Connect a slave to the main instance";
					
					client2.slaveof(server_host2, server_port2,function(err,res){
						ut.serverInfo(client2, 'role', function (err, res) {
							console.log(res);
							ut.pass(test_case);
							//testEmitter.emit('next');
							callback(null,false);
						});
						/* ut.wait_for_condition(500, 100, function (cb) {
							server2.role(function(err,res){
								console.log(res)
							})
						},function(){
							
							callback(null,true);
						}); */
					}); 
				},
			},function(err,res){
				callback(null,false);
				testEmitter.emit('next');
			});
			
			
		}
	}
	
    tester.scripting44 = function (errorCallback) {
	//Test that the server can be started using the truncated AOF.
	var args = {};
	args['name'] = name;
	args['tags'] = 'scripting';
	args['overrides'] = {};
	var server_host1 = '',
	server_port1 = '',
	server_pid1 = '';
	server1.start_server(client_pid, args, function (err, res) {
		if (err) {
			errorCallback(err, null);
		}
		server_pid1 = res;
		client1 = g.srv[client_pid][server_pid1]['client'];
		server_host1 = g.srv[client_pid][server_pid1]['host'];
		server_port1 = g.srv[client_pid][server_pid1]['port'];
		start_actual_test(function (err, res) {
			if (err) {
				errorCallback(err);
			}
			kill_server(function (err, res) {
				if (err) {
					errorCallback(err)
				}
			});
		});
	});
	function kill_server(callback) {
		server1.kill_server(client_pid, server_pid1, function (err, res) {
			if (err) {
				callback(err, null);
			} 
		});
	};
	function start_actual_test(callback) {
		async.series({
			one : function (async_cb) {
				var test_case = "Timedout read-only scripts can be killed by SCRIPT KILL"
				var newClient = redis.createClient(server_port1, server_host1);
				client1.config('set', 'lua-time-limit', 10);
				newClient.eval('while true do end', 0,function(err,res){});
				setTimeout(function () {
					client1.ping(function (err, res) {
						try{
							if(!assert.ok(ut.match("BUSY",err)),test_case){		
								client1.script("kill",function (err, res) {
									if(err){
										callback(err);
									}
									client1.ping(function(err, res) {
										try{
											if(!assert.equal(res,"PONG",test_case))
											ut.pass(test_case)
											}catch(e){
											ut.fail(e,true)
										}
										newClient.end();
										async_cb(null, false);
									});											
								});
							}									
							}catch(e){
							ut.fail(e,true);
							newClient.end();
							async_cb(null, true);
						}
					});
				}, 200); 				
			},
			two : function (async_cb) {
				var test_case = "Timedout script link is still usable after Lua returns";
				client1.config('set', 'lua-time-limit', 10);
				client1.eval("for i=1,100000 do redis.call('ping') end return 'ok'",0,function(err,res){
					client1.ping(function(err,res){
						try{
							if(!assert.equal(res,"PONG",test_case))
							ut.pass(test_case);
							}catch(e){
							ut.fail(e,true);
						}
						async_cb(null, true);
					});
				});
			},
			three : function (async_cb) {
				var test_case = "Timedout scripts that modified data can't be killed by SCRIPT KILL";
				var newClient = redis.createClient(server_port1, server_host1);
				newClient.eval("redis.call('set','x','y'); while true do end",0);
				setTimeout(function () {
					client1.ping(function(err,res){
						try{
							if(!assert.ok(ut.match("BUSY",err)),test_case){							
								client1.script('kill',function (err, res) {	
									try{
										if(!assert.ok(ut.match("UNKILLABLE",err)),test_case){
											client1.ping(function(err,res){
												async.series({
													a:function(async_cb){
														try{
															if(!assert.ok(ut.match("BUSY",err)),test_case){
																ut.pass(test_case);
															}
														}
														catch(e){
															ut.fail(e,true);
														}
														async_cb(null,false);
													},
													b:function(){
														var test_case = "SHUTDOWN NOSAVE can kill a timedout script anyway";
														client1.ping(function(err,res){
															try{
																if(!assert.ok(ut.match("BUSY",err)),test_case){
																	client1.shutdown('nosave',function(err,res){
																		try{
																			newClient1 = redis.createClient(server_port1, server_host1);
																			newClient1.on("error", function (msg) {
																				try{
																					if(!assert.ok(ut.match("connect ECONNREFUSED",msg)),test_case)
																					ut.pass(test_case);
																					}catch(e){
																					ut.fail(e,true);
																				}
																				newClient.end();
																				async_cb(null, false);
																			});
																			}catch(e){
																			ut.fail(e,true);
																			newClient.end();
																			async_cb(null, true);
																		}
																	});
																}
																}catch(e){
																ut.fail(e,true);
																newClient.end();
																async_cb(null, true);
															}
														});
													},
													},function(){
													async_cb(null, true);
												});														
											});
										}
										}catch(e){
										ut.fail(e,true);
										newClient.end();
										async_cb(null, true);
									}
								});
							}
							}catch(e){
							ut.fail(e,true);
							newClient.end();								
							async_cb(null, true);
						}
					});
				},200);
			},   
			
			}, function (err, rep) {
			if (err) {
				callback(err, null);
			}
			callback(null, true);
			testEmitter.emit('next');
		});
		
	}
}

	return scripting;
}
	())
