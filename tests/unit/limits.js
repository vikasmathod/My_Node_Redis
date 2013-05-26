exports.Limits = (function () {
	// private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	limits = {},
	name = 'Limits',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = '',
	server_host = '',
	server_port = '',
	client_pid = '';

	//public property
	limits.debug_mode = false;

	limits.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = 'limits';
			var overrides = {};
			overrides['maxclients'] = 10;
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
					if (limits.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		if (limits.debug_mode) {
			server.set_debug_mode(true);
		}
		testEmitter.emit('start');
	}

	tester.limits1 = function (errorCallback) {
		var test_case = 'Check if maxclients works refusing connections';
		var c = 0,
		iLoopIndex = 0;
		var newClient = '';
		g.asyncFor(0, 12, function (loop) {
			iLoopIndex = loop.iteration();
			setTimeout(function () {
				newClient = redis.createClient(server_port, server_host);
				newClient.on('ready', function () {
					newClient.ping(function (err, res) {
						if (err) {
							loop.break();
						}
						c++;
						loop.next();
					});
				});
				newClient.on('error', function (err,res) {
					loop.next();
				});				
			}, 100);
		}, function () {
			ut.assertOk(c > 8 && c <= 10,null,test_case);
			newClient.end();
			testEmitter.emit('next');
		});
	};
	return limits;
}
	());
