exports.Cas = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	cas = {},
	name = 'Cas',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = {};

	//public property
	cas.debug_mode = false;

	//public method
	cas.start_test = function (client_pid, callback) {
		testEmitter.on('start', function () {
			// write logic to start the server here.
			var tags = 'Cas';
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
					if (cas.debug_mode) {
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

		if (cas.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//private methods

	tester.cas1 = function (errorCallback) {
		var test_case = 'DISCARD without MULTI';
		client.discard(function (err, res) {
			if (res) {
				errorCallback(res);
			}
			try {
				if (!assert.ok(ut.match('DISCARD without MULTI', err), test_case)) {
					ut.pass(test_case);
					testEmitter.emit('next');
				}
			} catch (e) {
				ut.fail(e, true);
				testEmitter.emit('next');
			}
		})
	};

	tester.cas2 = function (errorCallback) {
		var test_case = 'MULTI with AOF';
		client.set('x', 10, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.multi(function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).incr('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).expire('x', 5, function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).setex('y', 5, 'foobar', function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).bgrewriteaof(function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).exec(function (err, replies) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.ok(ut.match('Background append only file rewriting started', replies[3]), test_case)) {
						ut.pass(test_case);
						testEmitter.emit('next');
					}
				} catch (e) {
					ut.fail(e, true);
					testEmitter.emit('next');
				}
			})
		})
	};

	return cas;

}
	());