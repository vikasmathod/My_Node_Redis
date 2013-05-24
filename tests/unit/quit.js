exports.Quit = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	quit = {},
	name = 'Quit',
	client = '',
	tester = {},
	server_pid = '',
	client_pid = '',
	all_tests = {};

	//public property
	quit.debug_mode = false;

	//public method
	quit.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = 'quit';
			var overrides = {};
			var args = {};
			args['name'] = name;
			args['tags'] = tags;
			args['overrides'] = overrides;
			client_pid = cpid;
			server.start_server(cpid, args, function (err, res) {
				if (err) {
					callback(err, null);
				}
				server_pid = res;
				server_port = g.srv[cpid][server_pid]['port'];
				server_host = g.srv[cpid][server_pid]['host'];
				// we already have a client while checking for the server, we dont need it now.
				g.srv[cpid][server_pid]['client'].end();
				if (quit.debug_mode) {
					log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[cpid][server_pid]['host'] + ':' + g.srv[cpid][server_pid]['port']);
				}
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
					testEmitter.emit('end');
				}
		});
		testEmitter.on('end', function () {
			server.kill_server(client_pid, server_pid, function (err, res) {
				if (err) {
					callback(err, null);
				} else if (res) {
					callback(null, true);
				}
			});
		});

		if (quit.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//private methods
	tester.quit1 = function (errorCallback) {
		var test_case = 'QUIT returns OK';
		ut.reconnect(redis, client_pid, server_pid, function (err, client) {
			if (err) {
				errorCallback(err);
			}
			if (quit.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
			}
			client.write(ut.formatCommand(['quit']), function (err, result) {
				if (err) {
					errorCallback(err);
				}
				client.ping(function (err, res) {
					if (res) {
						errorCallback(res);
					}
					ut.assertMany(
						[
							['ok',err, null],
							['equal',result, 'OK']
						],test_case);
					if (quit.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	tester.quit2 = function (errorCallback) {
		var test_case = 'Pipelined commands after QUIT must not be executed';
		ut.reconnect(redis, client_pid, server_pid, function (err, client) {
			if (err) {
				errorCallback(err);
			}
			if (quit.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
			}
			client.write(ut.formatCommand(['quit']), function (err, result) {
				if (err) {
					errorCallback(err);
				}
				if (quit.debug_mode) {
					log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
				}
				client.write(ut.formatCommand(['set', 'foo', 'bar']), function (error, res2) {
					if (err) {
						errorCallback(err);
					}
					ut.reconnect(redis, client_pid, server_pid, function (err, client) {
						if (err) {
							errorCallback(err);
						}
						if (quit.debug_mode) {
							log.notice(name + ':Client connected  and listening on socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
						}
						client.get('foo', function (err, res) {
							if (err) {
								errorCallback(res);
							}
							ut.assertMany(
								[
									['equal',res, null],
									['ok',error, null],
									['equal',result, 'OK']
								],test_case);
							client.end();
							if (quit.debug_mode) {
								log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	};
	tester.quit3 = function (errorCallback) {
		var test_case = 'Pipelined commands after QUIT that exceed read buffer size';
		ut.reconnect(redis, client_pid, server_pid, function (err, client) {
			if (err) {
				errorCallback(err);
			}
			if (quit.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
			}
			client.write(ut.formatCommand(['quit']), function (err, result) {
				if (err) {
					errorCallback(err);
				}
				if (quit.debug_mode) {
					log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
				}
				client.write(ut.formatCommand(['set', 'foo', g.fillString(1000, 'x')]), function (error, res2) {
					if (err) {
						errorCallback(err);
					}
					ut.reconnect(redis, client_pid, server_pid, function (err, client) {
						if (err) {
							errorCallback(err);
						}
						if (quit.debug_mode) {
							log.notice(name + ':Client connected  and listening on socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
						}
						client.get('foo', function (err, res) {
							if (err) {
								errorCallback(res);
							}
							ut.assertMany(
								[
									['equal',res, null],
									['ok',error, null],
									['equal',result, 'OK']
								],test_case);
							client.end();
							if (quit.debug_mode) {
								log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	};

	return quit;

}
	());