exports.Replication2 = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	replication2 = {},
	name = 'Replication2',
	tester = {},
	all_tests = {},
	master_host = '',
	master_port = '',
	master_cli = '',
	slave_cli = '',
	server_pid = '',
	server_pid2 = '';

	//public property
	replication2.debug_mode = false;

	//public method
	replication2.start_test = function (client_pid, callback) {
		testEmitter.on('start', function () {
			var tags = 'repl-2';
			var overrides = {};
			var args = {};
			args['name'] = name + '(Master)';
			args['tags'] = tags;
			server.start_server(client_pid, args, function (err, res) {
				if (err) {
					callback(err, null);
				}
				server_pid = res;
				// nesting calls to start_server
				setTimeout(function () { // to give some time for the master to start.
					master_cli = g.srv[client_pid][server_pid]['client'];
					master_host = g.srv[client_pid][server_pid]['host'];
					master_port = g.srv[client_pid][server_pid]['port'];
					var tags = 'repl';
					var overrides = {};
					var args = {};
					args['name'] = name + '(Slave0)';
					args['tags'] = tags;
					args['overrides'] = overrides;
					(new Server()).start_server(client_pid, args, function (err, res) {
						if (err) {
							callback(err, null);
						}
						server_pid2 = res;
						slave_cli = g.srv[client_pid][server_pid2]['client'];
						all_tests = Object.keys(tester);
						testEmitter.emit('next');
					});
				}, 100);
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
					slave_cli.end();
					master_cli.end();
					if (replication2.debug_mode) {
						log.notice(g.srv[client_pid][server_pid2]['name'] + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid2]['host'] + ':' + g.srv[client_pid][server_pid2]['port']);
						log.notice(g.srv[client_pid][server_pid]['name'] + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		testEmitter.on('end', function () {
			server.kill_server(client_pid, server_pid, function (err, res) {
				if (err) {
					callback(err, null);
				} else {
					server.kill_server(client_pid, server_pid2, function (err, res) {
						if (err) {
							callback(err, null);
						} else if (res) {
							callback(null, true);
						}
					});
				}
			});
		});

		if (replication2.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//private methods

	tester.Repl21 = function (errorCallback) {
		var test_case = 'First server should have role slave after SLAVEOF';
		slave_cli.slaveof(master_host, master_port, function (err, res) {
			if (err) {
				errorCallback(err)
			}
			setTimeout(function () {
				ut.serverInfo(slave_cli, 'role', function (err, res) {
					if (err) {
						errorCallback(err)
					}
					try {
						if (!assert.equal(res, 'slave', test_case)) {
							ut.pass(test_case);
						}
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			}, 1000);
		});
	};

	tester.Repl22 = function (errorCallback) {
		var test_case = 'MASTER and SLAVE dataset should be identical after complex ops';
		ut.createComplexDataset(master_cli, 10000, null, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			setTimeout(function () {
				master_cli.debug('digest', function (err, digest) {
					if (err) {
						errorCallback(err);
					}
					slave_cli.debug('digest', function (err, digest0) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.deepEqual(digest, digest0, test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							ut.csvdump(master_cli, function (err, csv1) {
								if (err) {
									errorCallback(err);
								}
								ut.csvdump(slave_cli, function (err, csv2) {
									if (err) {
										errorCallback(err);
									}
									fs.writeFileSync('./tests/tmp/repldump1.txt', csv1);
									fs.writeFileSync('./tests/tmp/repldump2.txt', csv2);
									console.log('Master - Slave inconsistency');
									console.log('Run diff -u against /tmp/repldump*.txt for more info');
									testEmitter.emit('next');
								});
							});
						}
					});
				});
			}, 500);
		});
	};

	return replication2
}
	());