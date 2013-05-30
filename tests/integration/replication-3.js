// The copyright in this software is being made available under the BSD License, included below. This software may be subject to other third party and contributor rights, including patent rights, and no such rights are granted under this license.
//
// Copyright (c) 2013, Microsoft Open Technologies, Inc. 
//
// All rights reserved.
// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
//     -             Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
//     -             Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
//     -             Neither the name of the Microsoft Open Technologies, Inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

exports.Replication3 = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	replication3 = {},
	name = 'Replication3',
	tester = {},
	all_tests = {},
	master_host = '',
	master_port = '',
	master_cli = '',
	slave_cli = '',
	server_pid = '',
	server_pid2 = '';

	//public property
	replication3.debug_mode = false;

	//public method
	replication3.start_test = function (client_pid, callback) {
		testEmitter.on('start', function () {
			var tags = 'repl-3';
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
					if (replication3.debug_mode) {
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

		if (replication3.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//private methods

	tester.Repl31 = function (errorCallback) {
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
					ut.assertEqual(res, 'slave', test_case);
					testEmitter.emit('next');
				});
			}, 1000);
		});
	};

	tester.Repl32 = function (errorCallback) {
		var test_case = 'MASTER and SLAVE dataset should be identical after complex ops';
		var numops = 5000;
		ut.createComplexDataset(master_cli, numops, 'useexpire', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			setTimeout(function () {
				master_cli.keys('*', function (err, res) {
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
								var bool_Res = ut.assertDeepEqual(digest, digest0, test_case,true);
								if(bool_Res){
									ut.pass(test_case);
									testEmitter.emit('next');
								} else{
									ut.csvdump(master_cli, function (err, csv1) {
										if (err) {
											errorCallback(err);
										}
										ut.csvdump(slave_cli, function (err, csv2) {
											if (err) {
												errorCallback(err);
											}
											fs.writeFileSync('./tests/tmp/repldump_useexpire1.txt', csv1);
											fs.writeFileSync('./tests/tmp/repldump_useexpire2.txt', csv2);
											console.log('Master - Slave inconsistency');
											console.log('Run diff -u against /tmp/repldump_useexpire*.txt for more info');
											testEmitter.emit('next');
										});
									});
								}
							});
						});
					}, 1000);
				});
			}, 4000);
		});
	};

	return replication3;

}
	());