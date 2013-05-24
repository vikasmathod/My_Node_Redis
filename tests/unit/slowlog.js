exports.Slowlog = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	slowlog = {},
	name = 'Slowlog',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = {};

	//public property
	slowlog.debug_mode = false;

	//public method
	slowlog.start_test = function (client_pid, callback) {
		testEmitter.on('start', function () {
			var tags = 'slowlog';
			var overrides = {};
			overrides['slowlog-log-slower-than'] = 1000000;
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
				all_tests = Object.keys(tester);
				testEmitter.emit('next');
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
					if (slowlog.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		testEmitter.on('end', function () {
			server.kill_server(client_pid, server_pid, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			});
		});

		if (slowlog.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//test methods
	tester.slowlog1 = function (errorCallback) {
		var test_case = 'SLOWLOG - check that it starts with an empty log';
		client.slowlog('len', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			try {
				if (!assert.equal(res, 0, test_case)) {
					ut.pass(test_case);
					testEmitter.emit('next');
				}
			} catch (e) {
				ut.fail(e, true);
				testEmitter.emit('next');
			}
		});
	};
	tester.slowlog2 = function (errorCallback) {
		var test_case = 'SLOWLOG - only logs commands taking more time than specified';
		var result = new Array();
		client.config('set', 'slowlog-log-slower-than', 100000, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.ping(function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.slowlog('len', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result.push(res);
					client.debug('sleep', 0.2, function (err, res) {
						if (err) {
							errorCallback(err);
						}
						client.slowlog('len', function (err, res) {
							if (err) {
								errorCallback(err);
							}
							result.push(res);
							try {
								if (!assert.deepEqual(result, [0, 1], test_case)) {
									ut.pass(test_case);
									testEmitter.emit('next');
								}
							} catch (e) {
								ut.fail(e, true);
								testEmitter.emit('next');
							}
						});
					});
				});
			});
		});
	};
	tester.slowlog3 = function (errorCallback) {
		var test_case = 'SLOWLOG - max entries is correctly handled';
		client.config('set', 'slowlog-log-slower-than', 0, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.config('set', 'slowlog-max-len', 10, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				g.asyncFor(0, 100, function (loop) {
					client.ping(function (err, res) {
						loop.next();
					});
				}, function () {
					client.slowlog('len', function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, 10, test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							testEmitter.emit('next');
						}
					});
				});
			});
		});
	};

	tester.slowlog4 = function (errorCallback) {
		var test_case = 'SLOWLOG - GET optional argument to limit output len works';
		client.slowlog('get', 5, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			try {
				if (!assert.equal(res.length, 5, test_case)) {
					ut.pass(test_case);
					testEmitter.emit('next');
				}
			} catch (e) {
				ut.fail(e, true);
				testEmitter.emit('next');
			}
		})
	};
	tester.slowlog5 = function (errorCallback) {
		var test_case = 'SLOWLOG - RESET subcommand works';
		client.config('set', 'slowlog-log-slower-than', 100000, function (err, res1) {
			if (err) {
				errorCallback(err);
			}
			client.slowlog('reset', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.slowlog('len', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					try {
						if (!assert.equal(res, 0, test_case)) {
							ut.pass(test_case);
							testEmitter.emit('next');
						}
					} catch (e) {
						ut.fail(e, true);
						testEmitter.emit('next');
					}
				});
			});
		});
	};

	tester.slowlog6 = function (errorCallback) {
		var test_case = 'SLOWLOG - logged entry sanity check';
		var e = new Array();
		client.debug('sleep', 0.2, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.slowlog('get', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				e = res[0];
				try {
					if ((!assert.equal(e.length, 4, test_case)) &&
						(!assert.equal(e[0], 105, test_case)) &&
						(!assert.ok(check(e[2], 10000), test_case)) &&
						(!assert.deepEqual(e[3], ['debug', 'sleep', '0.2'], test_case))) {
						ut.pass(test_case);
						testEmitter.emit('next');
					}
				} catch (e) {
					ut.fail(e, true);
					testEmitter.emit('next');
				}
				function check(a, b) {
					if (a > b)
						return true;
					else
						return false;
				}
			});
		});
	};

	tester.slowlog7 = function (errorCallback) {
		var test_case = 'SLOWLOG - commands with too many arguments are trimmed';
		var e = new Array();
		client.config('set', 'slowlog-log-slower-than', 0, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.slowlog('reset', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.sadd('set', 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, function (err, res) {
					if (err) {
						callback(err, null);
					}
					client.slowlog('get', function (err, res) {
						if (err) {
							errorCallback(err);
						}
						e = res[0];
						var Res = e[3];
						var expres = ['sadd', 'set', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '... (2 more arguments)'];
						try {
							if (!assert.deepEqual(Res, expres, test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							testEmitter.emit('next');
						}
					});
				});
			});
		});
	};

	tester.slowlog8 = function (errorCallback) {
		var test_case = 'SLOWLOG - too long arguments are trimmed';
		var e = new Array();
		var arguments = new Array();
		client.config('set', 'slowlog-log-slower-than', 0, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.slowlog('reset', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				var arguments = 'A';

				for (var i = 0; i < 129; i++)
					arguments += 'A';

				client.sadd('set', 'foo', arguments, function (err, res) {
					if (err) {
						callback(err, null);
					}
					client.slowlog('get', function (err, res) {
						if (err) {
							errorCallback(err);
						}
						e = res[0];
						client.lindex(e, 3, function (err, res) {
							if (err) {
								errorCallback(err);
							}
							try {
								if (!assert.deepEqual(res, null, test_case)) {
									ut.pass(test_case);
									testEmitter.emit('next');
								}
							} catch (e) {
								ut.fail(e, true);
								testEmitter.emit('next');
							}
						});
					});
				});
			});
		});
	};

	return slowlog;

}
	());