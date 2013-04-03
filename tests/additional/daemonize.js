exports.Deamon = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	tp = new(require('../support/tmpfile.js'));
	deamon = {},
	name = "Daemonize",
	tester = {},
	all_tests = {},
	server_pid = "",
	client_pid = "";

	//public property
	deamon.debug_mode = false;

	//public method
	deamon.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			client_pid = cpid;
			all_tests = Object.keys(tester);
			testEmitter.emit('next');
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
		testEmitter.on('end', function () {
			callback(null, true);
		});

		if (deamon.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//private methods
	function start_server(client_pid, option, callback) {
		var tags = "daemonize";
		var overrides = {};
		overrides['daemonize'] = option;
		var args = {};
		args['name'] = name;
		args['tags'] = tags;
		args['overrides'] = overrides;
		(new Server()).start_server(client_pid, args, function (err, res) {
			if (err) {
				callback(err, null);
			}
			g.srv[client_pid][res]['client'].end();
			callback(null, res); // returned is server.pid
		});
	}
	function kill_server(client_pid, server_pid, callback) {
		server.kill_server(client_pid, server_pid, callback);
	}
	tester.Daemon1 = function (errorCallback) {
		var test_case = "Windows does not support daemonize: Warning is seen.";
		var option = "yes";
		start_server(client_pid, option, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			server_pid = res;
			var pattern = "Windows does not support daemonize. Start Redis as service";
			var retry = 10;
			g.asyncFor(0, retry, function (loop) {
				retry = loop.iteration();
				var file = g.srv[client_pid][server_pid]['stdout'];
				fs.readFile(file, function (err, result) {
					if (err) {
						errorCallback(err, null);
					}
					if (ut.match(pattern, result)) {
						loop.break();
					} else {
						loop.decrease(1);
						//retry-=1;
						setTimeout(function () {
							loop.next();
						}, 1000);
					}
				});
			}, function () {
				try {
					if (!assert.equal(retry, 0, test_case)) {
						ut.pass(test_case);
					}
				} catch (e) {
					console.log("assertion:expected warning not found on config file");
					ut.fail(e);
				}
				kill_server(client_pid, server_pid, function (err, res) {
					if (err) {
						errorCallback(err, null);
					}
					testEmitter.emit('next');
				});
			});
		});
	}

	return deamon;

}
	());