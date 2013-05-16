exports.PrintVer = (function () {
	// private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	printver = {},
	name = 'Printver',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = {};

	//public property
	printver.debug_mode = false;

	// public methods
	printver.start_test = function (client_pid, callback) {
		testEmitter.on('start', function () {
			var tags = 'printver';
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
					if (printver.debug_mode) {
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
		if (printver.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	// private methods
	tester.getInfo = function (errorCallback) {
		var test_case = 'Testing Redis version'
			client.info(function (err, res) {
				var version = client.server_info.redis_version
					var sha1 = client.server_info.redis_git_sha1
					if (version) {
						ut.pass(test_case + version + '(' + sha1 + ')');
						testEmitter.emit('next');
					} else {
						ut.fail(test_case, true);
						testEmitter.emit('next');
					}
			})
	}

	return printver;

}
	());