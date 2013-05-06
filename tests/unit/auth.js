exports.Auth = (function () {
	// private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	auth = {},
	name = 'Auth',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = '',
	client_pid = '';

	//public property
	auth.debug_mode = false;

	//public method
	auth.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			client_pid = cpid;
			all_tests = Object.keys(tester);
			testEmitter.emit('next');
		});
		testEmitter.on('end', function () {
			callback(null, true);
		});
		testEmitter.on('next', function () {
			var test_case_name = all_tests.shift()
				if (test_case_name) {
					tester[test_case_name](function (error) {
						ut.fail(error);
						testEmitter.emit('next');
					});
				} else {
					testEmitter.emit('end');
				}
		});
		if (auth.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}
	//private methods
	function start_server_auth(client_pid, password, callback) {
		var tags = 'auth';
		var overrides = {};
		if (password !== null)
			overrides['requirepass'] = password;
		var args = {};
		args['name'] = name;
		args['tags'] = tags;
		args['overrides'] = overrides;
		(new Server()).start_server(client_pid, args, function (err, res) {
			if (err) {
				callback(err, null);
			}
			callback(null, res); // returned is server.pid
		});
	}
	function kill_server_auth(client_pid, server_pid, callback) {
		server.kill_server(client_pid, server_pid, function (err, res) {
			if (err) {
				callback(err, null);
			} else if (res) {
				callback(null, true);
			}
		});
	}
	tester.Auth1 = function (errorCallback) {
		var test_case = 'AUTH fails if there is no password configured server side';
		start_server_auth(client_pid, null, function (err, res) {
			if (err) {
				callback(err, null);
			}
			server_pid = res;
			client = g.srv[client_pid][server_pid]['client'];
			client.auth('foo', function (err, res) {
				try {
					if (!assert.ok(ut.match('no password', err), test_case)) {
						ut.pass(test_case);
					}
				} catch (e) {
					ut.fail(e, true);
				}
				client.end();
				if (auth.debug_mode) {
					log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
				}
				kill_server_auth(client_pid, server_pid, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					testEmitter.emit('next');
				});
			});
		});
	};
	tester.Auth2 = function (errorCallback) {
		var test_case = 'AUTH fails when a wrong password is given';
		start_server_auth(client_pid, 'foobar', function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			server_pid = res;
			client = g.srv[client_pid][server_pid]['client'];
			client.auth('wrong!', function (err, res) {
				try {
					if (!assert.ok(ut.match('ERR invalid password', err), test_case)) {
						ut.pass(test_case);
					}
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	};
	tester.Auth3 = function (errorCallback) {
		var test_case = 'Arbitrary command gives an error when AUTH is required';
		client.set('foo', 'bar', function (err, res) {
			try {
				if (!assert.ok(ut.match('ERR operation not permitted', err), test_case)) {
					ut.pass(test_case);
				}
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};
	tester.Auth4 = function (errorCallback) {
		var test_case = 'AUTH succeeds when the right password is given';
		client.auth('foobar', function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			try {
				if (!assert.equal(res, 'OK', test_case)) {
					ut.pass(test_case);
				}
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};
	tester.Auth5 = function (errorCallback) {
		var test_case = 'Once AUTH succeeded we can actually send commands to the server';
		client.set('foo', 100, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.incr('foo', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.equal(res, 101, test_case)) {
						ut.pass(test_case);
					}
				} catch (e) {
					ut.fail(e, true);
				}
				client.end();
				if (auth.debug_mode) {
					log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
				}
				//killing the server here.
				kill_server_auth(client_pid, server_pid, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	return auth;

}
	());