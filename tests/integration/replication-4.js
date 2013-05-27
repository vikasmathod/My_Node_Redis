exports.Replication4 = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	server1 = new Server(),
	replication4 = {},
	name = 'Replication4',
	tester = {},
	all_tests = {},
	master_host = '',
	master_port = '',
	client_pid = '',
	monitor_cli = '',
	master_cli = '',
	slave_cli = '',
	load_handle0 = '',
	load_handle1 = '',
	load_handle2 = '',
	server_pid = '',
	server_pid2 = '';

	//public property
	replication4.debug_mode = false;

	//public method
	replication4.start_test = function (pid, callback) {
		testEmitter.on('start', function () {
			client_pid = pid;
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

		if (replication4.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//private methods

	function start_bg_complex_data(host, port, db, ops) {
		var forked = child.fork('./tests/helpers/bg_complex_data.js', [host, port, db, ops]);
		return forked;
	}

	function stop_bg_complex_data(handle) {
		try {
			handle.kill('SIGKILL');
		} catch (e) {}
	}

	tester.Repl41 = function (errorCallback) {
		var tags = 'repl-41';
		var overrides = {};
		var args = {};
		args['name'] = name + '(Master)';
		args['tags'] = tags;
		server.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			server_pid = res;
			// nesting calls to start_server
			setTimeout(function () { // to give some time for the master to start.
				master_cli = g.srv[client_pid][server_pid]['client'];
				master_host = g.srv[client_pid][server_pid]['host'];
				master_port = g.srv[client_pid][server_pid]['port'];
				monitor_cli = redis.createClient(master_port, master_port);
				monitor_cli.on('ready', function () {
					if (replication4.debug_mode) {
						log.notice('Monitor client connected  and listening on socket: ' + master_port + ':' + master_host);
					}
				});
				var tags = 'repl-mr12';
				var overrides = {};
				var args = {};
				args['tags'] = tags;
				args['name'] = name + '(Slave0)';
				args['overrides'] = overrides;
				server1.start_server(client_pid, args, function (err, res) {
					if (err) {
						errorCallback(err, null);
					}
					server_pid2 = res;
					slave_cli = g.srv[client_pid][server_pid2]['client'];
					setTimeout(function(){load_handle0 = start_bg_complex_data(master_host, master_port, 0, 100000);},100);
					setTimeout(function(){load_handle1 = start_bg_complex_data(master_host, master_port, 11, 100000);},100);
					setTimeout(function(){load_handle2 = start_bg_complex_data(master_host, master_port, 12, 100000);},100);
					
					
					start_actual_test(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						monitor_cli.end();
						slave_cli.end();
						master_cli.end();
						if (replication4.debug_mode) {
							log.notice('Monitor client disconnected listeting to socket : ' + g.srv[client_pid][server_pid2]['host'] + ':' + g.srv[client_pid][server_pid2]['port']);
							log.notice(g.srv[client_pid][server_pid2]['name'] + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid2]['host'] + ':' + g.srv[client_pid][server_pid2]['port']);
							log.notice(g.srv[client_pid][server_pid]['name'] + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
						}
						kill_server(function (err, res) {
							if (err) {
								errorCallback(err)
							}
							testEmitter.emit('next');
						});
					});
				});
			}, 100);
		});

		function kill_server(callback) {
			server.kill_server(client_pid, server_pid, function (err, res) {
				if (err) {
					callback(err, null);
				} else {
					server1.kill_server(client_pid, server_pid2, function (err, res) {
						if (err) {
							callback(err, null);
						} else if (res) {
							callback(null, true);
						}
					});
				}
			});
		};

		function start_actual_test(callback) {
			async.series({
				one : function (cb) {
					var test_case = 'First server should have role slave after SLAVEOF';
					slave_cli.slaveof(master_host, master_port, function (err, res) {
						if (err) {
							cb(err, null);
						}
						setTimeout(function () {
							ut.serverInfo(slave_cli, 'role', function (err, res) {
								if (err) {
									cb(err, null);
								}
								try {
									if (!assert.equal(res, 'slave', test_case)) {
										ut.pass(test_case);
										cb(null, null);
									}
								} catch (e) {
									cb(e, null);
								}
							});
						}, 1000);
					});
				},
				two : function (cb) {
					var test_case = 'Test replication with parallel clients writing in differnet DBs';
					setTimeout(function () {
						stop_bg_complex_data(load_handle0);
						stop_bg_complex_data(load_handle1);
						stop_bg_complex_data(load_handle2);
						
						var retry = 10;
						g.asyncFor(0, retry, function (loop) {
							master_cli.debug('digest', function (err, digest0) {
								if (err) {
									cb(err, null);
								}
								slave_cli.debug('digest', function (err, digest1) {
									if (err) {
										cb(err, null);
									}
									if (digest0 != digest1) {
										setTimeout(function () {
											loop.next();
										}, 1000);
									} else {
										loop.
										break();
									}
								});
							});
						}, function () {
							master_cli.dbsize(function (err, res) {
								if (err) {
									cb(err, null);
								}
								if (res <= 0) {
									cb(new Error('Master is inconsistent.'), null);
								}
								master_cli.debug('digest', function (err, digest) {
									if (err) {
										cb(err, null);
									}
									slave_cli.debug('digest', function (err, digest0) {
										if (err) {
											cb(err, null);
										}
										var res_Bool = ut.assertDeepEqual(digest, digest0, test_case, true);
										if(res_Bool){
											ut.pass(test_case);
											cb(null, null);
										} else{
											ut.csvdump(master_cli, function (err, csv1) {
												if (err) {
													cb(err, null);
												}
												ut.csvdump(slave_cli, function (err, csv2) {
													if (err) {
														cb(err, null);
													}
													fs.writeFileSync('./tests/tmp/repldump1.txt', csv1);
													fs.writeFileSync('./tests/tmp/repldump2.txt', csv2);
													console.log('Master - Slave inconsistency');
													console.log('Run diff -u against /tmp/repldump*.txt for more info');
													cb(err, null);
												});
											});
										}
									});
								});
							});
						});
					}, 5000);
				},
			}, function (err, rep) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			});
		};
	};

	return replication4;

}
	());