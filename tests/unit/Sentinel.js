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

exports.Sentinel = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	sentinel_mod = require('node-sentinel'),
	ut = new Utility(),
	masterServer = new Server(),
	slaveServer = new Server(),
	server = new Server(),
	sentinel = {},
	name = 'Sentinel',
	client = '',
	sentinel_cli = '',
	master_cli = '',
	slave_cli = '',
	tester = {},
	server_pid = '',
	server_port = '',
	server_host = '',
	m_server_pid = '',
	m_server_port = '',
	m_server_host = '',
	s_server_pid = '',
	s_server_port = '',
	s_server_host = '',
	client_pid = '',
	all_tests = {};

	//public property
	sentinel.debug_mode = false;

	//public method
	sentinel.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = 'sentinel-master';
			var overrides = {};
			var args = {};
			args['name'] = name;
			args['tags'] = tags;
			args['overrides'] = overrides;
			client_pid = cpid;
			masterServer.start_server(cpid, args, function (err, res) {
				if (err) {
					callback(err, null);
				}
				m_server_pid = res;
				m_server_port = g.srv[cpid][m_server_pid]['port'];
				m_server_host = g.srv[cpid][m_server_pid]['host'];
				master_cli = g.srv[cpid][m_server_pid]['client'];
				args = {};
				args['name'] = 'Sentinel_Slave';
				args['tags'] = 'Sentinel_Slave';
				args['overrides'] = overrides;
				slaveServer.start_server(cpid, args, function (err, res) {
					if (err) {
						callback(err, null);
					}
					s_server_pid = res;
					s_server_port = g.srv[cpid][s_server_pid]['port'];
					s_server_host = g.srv[cpid][s_server_pid]['host'];
					slave_cli = g.srv[cpid][s_server_pid]['client'];
					
					args = {};
					overrides = {};
					args['name'] = 'Sentinel';
					args['tags'] = 'sentinel';
					overrides['sentinel monitor'] = 'mymaster1 ' + m_server_host + ' ' + m_server_port + ' 2';
					args['overrides'] = overrides;
					server.start_server(cpid, args, function (err, res) {
						if (err) {
							callback(err, null);
						}
						server_pid = res;
						server_port = g.srv[cpid][server_pid]['port'];
						server_host = g.srv[cpid][server_pid]['host'];
						// we already have a client while checking for the server, we dont need it now.
						g.srv[cpid][server_pid]['client'].end();
						sentinel_cli = new sentinel_mod(server_host, server_port);
						
						if (sentinel.debug_mode) {
							log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[cpid][server_pid]['host'] + ':' + g.srv[cpid][server_pid]['port']);
						}
						all_tests = Object.keys(tester);
						testEmitter.emit('next');
					});
				});
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
			/* sentinel_cli.reset('mymaster', function (err, success) {
				console.log('reset');
			}); */
			master_cli.end();
			slave_cli.end();
			masterServer.kill_server(client_pid, m_server_pid, function (err, res) {
				if (err) {
					callback(err, null);
				} else if (res) {
					slaveServer.kill_server(client_pid, s_server_pid, function (err, res) {
						if (err) {
							callback(err, null);
						} else if (res) {
							server.kill_server(client_pid, server_pid, function (err, res) {
								if (err) {
									callback(err, null);
								} else if (res) {
									callback(null, true);
								}
							});
						}
					});
				}
			});
		});

		if (sentinel.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//testMethods methods
	tester.sentinel1 = function (errorCallback) {
		var test_case = 'API returns PONG on PING';
		sentinel_cli.ping(function (err, pong) {
			ut.assertEqual(pong,'PONG',test_case);
			testEmitter.emit('next');
		});
	}
	
	tester.sentinel2 = function (errorCallback) {
		var test_case = 'Master Info';
		sentinel_cli.masters(function (err, masters) {
			ut.assertEqual(masters[0]['name'],'mymaster1',test_case);
			testEmitter.emit('next');
		});
	}
	
	tester.sentinel3 = function (errorCallback) {
		var test_case = 'Slave Info';
		slave_cli.slaveof(m_server_host, m_server_port, function(err,res){	
		console.log('err-->' + err);
		console.log('res-->' + res);
			sentinel_cli.slaves('mymaster1', function (err, slaves) {
				console.log(slaves);
				ut.pass(test_case);
				//ut.assertEqual(masters[0]['name'],'mymaster1',test_case);
				testEmitter.emit('next');
			});
		});
	}
	return sentinel;

}
	());