exports.Protocol = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	protocol = {},
	name = 'Protocol',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = '',
	client_pid = '',
	server_port = '',
	server_host = '',
	seq = new Array('\x00', '*\x00', '$\x00');

	//public property
	protocol.debug_mode = false;

	//public method
	protocol.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			// write logic to start the server here.
			var tags = 'protocol';
			var overrides = {};
			var args = {};
			args['name'] = name;
			args['tags'] = tags;
			args['overrides'] = overrides;
			server.start_server(cpid, args, function (err, res) {
				if (err) {
					callback(err, null);
				}
				server_pid = res;
				client_pid = cpid;
				server_port = g.srv[cpid][server_pid]['port'];
				server_host = g.srv[cpid][server_pid]['host'];
				// we already have a client while checking for the server, we dont need it now.
				g.srv[client_pid][server_pid]['client'].end();
				if (protocol.debug_mode) {
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

		if (protocol.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}
	
	// test methods 
	tester.Proto1 = function (errorCallback) {
		var test_case = 'Handle an empty query';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			var result = data.toString().slice(1).split(/\r\n/g);
			ut.assertEqual(result[0], 'PONG', test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write('\r\n');
		stream.write(ut.formatCommand(['PING']));
	};

	tester.Proto2 = function (errorCallback) {
		var test_case = 'Negative multibulk length';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			var result = data.toString().slice(1).split(/\r\n/g);
			ut.assertEqual(result[0], 'PONG', test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write('*-10\r\n');
		stream.write(ut.formatCommand(['PING']));
	};

	tester.Proto3 = function (errorCallback) {
		var test_case = 'Out of range multibulk length';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			ut.assertOk('invalid multibulk length', data.toString(), test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write('*20000000\r\n');
	};

	tester.Proto4 = function (errorCallback) {
		var test_case = 'Wrong multibulk payload header';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			ut.assertOk('[expected \'$\', got \'f\']', data.toString(), test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write('*3\r\n\$3\r\nSET\r\n\$1\r\nx\r\nfooz\r\n');
	};

	tester.Proto5 = function (errorCallback) {
		var test_case = 'Negative multibulk payload length';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			ut.assertOk('invalid bulk length', data.toString(), test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write('*3\r\n\$3\r\nSET\r\n\$1\r\nx\r\n\$-10\r\n');
	};

	tester.Proto6 = function (errorCallback) {
		var test_case = 'Out of range multibulk payload length';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			ut.assertOk('invalid bulk length', data.toString(), test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write('*3\r\n\$3\r\nSET\r\n\$1\r\nx\r\n\$2000000000\r\n');
	};

	tester.Proto7 = function (errorCallback) {
		var test_case = 'Non-number multibulk payload length';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			ut.assertOk('invalid bulk length', data.toString(), test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write('*3\r\n\$3\r\nSET\r\n\$1\r\nx\r\n\$blabla\r\n');
	};

	tester.Proto8 = function (errorCallback) {
		var test_case = 'Multi bulk request not followed by bulk arguments';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			ut.assertOk('[expected \'$\', got \'f\']', data.toString(), test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write('*1\r\nfoo\r\n');
	};
	
	tester.Proto9 = function (errorCallback) {
		var test_case = 'Generic wrong number of args';
		var stream = net.createConnection(server_port, server_host);
		stream.on('connect', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
		});
		stream.on('error', function (err) {
			errorCallback(err);
		});
		stream.on('data', function (data) {
			ut.assertOk('[wrong*][arguments][\'ping\'*]', data.toString(), test_case);
			stream.end();
			if (protocol.debug_mode) {
				log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
			}
			testEmitter.emit('next');
		});
		stream.write(ut.formatCommand(['PING','x','y','z']));
	};
	
	tester.Proto10 = function (errorCallback) {
		g.asyncFor(0, seq.length, function (outerloop) {
			var retval;
			var error = '';
			var stream = net.createConnection(server_port, server_host);
			stream.on('connect', function () {
				if (protocol.debug_mode) {
					log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
				}
			});
			stream.on('error', function (err) {
				error = err;
			});
			var i = outerloop.iteration();
			var test_case = 'Protocol desync regression test #' + i;
			stream.write(seq[i]);

			//windows - set nonblocking
			//fconfigure $s -blocking false

			var payload = g.fillString(1024, 'A');
			payload += '\n';
			var test_start = new Date().getSeconds();
			var test_time_limit = 30;
			g.asyncFor(0, -1, function (innerloop) {
				stream.write(payload, function (err, res) {
					if (err) {
						retval = err;
						stream.end();
						if (protocol.debug_mode) {
							log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
						}
						innerloop.break();
					} else {
						//windows - if data available, read line
						//if {[read $s 1] ne ''} { set retval [gets $s] }
						if (res)
							retval = res;
						var elapsed = new Date().getSeconds() - test_start;
						if (elapsed > test_time_limit) {
							stream.end();
							if (protocol.debug_mode) {
								log.notice(name + ':Client disconnected listeting to socket : ' + server_host + ':' + server_port);
							}
							errorCallback(new Error('assertion:Redis did not closed connection after protocol desync'));
							innerloop.break();
						}
						innerloop.next();
					}
				});
			}, function () {});

			stream.on('close', function (data) {
				error = fs.readFileSync(server.stdout_file).toString().split('\n');
				retval = error[error.length - 2];
				ut.assertOk('Protocol error', retval, test_case);
				outerloop.next();

			});

		}, function () {
			testEmitter.emit('next');
		});
	};

	tester.Proto11 = function (errorCallback) {
		var test_case = 'Regression for a crash with blocking ops and pipelining';
		client1 = redis.createClient(server_port, server_host);
		client1.on('ready', function () {
			if (protocol.debug_mode) {
				log.notice(name + ':Client connected  and listening on socket: ' + server_host + ':' + server_port);
			}
			//create a stream and write BLPOP command in that stream
			var stream = net.createConnection(server_port, server_host);
			stream.on('connect', function () {
				if (protocol.debug_mode) {
					log.notice(name + ':Client connected  and listening on socket: ' + server_port + ':' + server_host);
				}
			});
			stream.on('error', function (err) {
				errorCallback(err);
			});
			//flush
			stream.on('data', function (err) {
				stream.end();

			});
			stream.write('*3\r\n\$5\r\nBLPOP\r\n\$6\r\nnolist\r\n\$1\r\n0\r\n*3\r\n\$5\r\nBLPOP\r\n\$6\r\nnolist\r\n\$1\r\n0\r\n');

			client1.rpush('nolist', 'a', function (err, res) {
				if (err) {
					errorCallback(err);
				} else if (res) {
					client1.rpush('nolist', 'a', function (err, res) {
						if (err) {
							ut.fail(err,true);
						} else if (res) {
							ut.pass(test_case);
						}
						client1.end();
						testEmitter.emit('next');
					});
				}
			});
		});
	}

	return protocol;

}
	());
