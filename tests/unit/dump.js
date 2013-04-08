exports.Dump = (function () {
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	server1 = new Server(),
	server2 = new Server(),
	server3 = new Server(),
	server4 = new Server(),
	server5 = new Server();
	var dump = {},
	name = "Dump",
	client = "",
	tester = {},
	server_pid = "",
	all_tests = "",
	client_pid = "";

	//public property
	dump.debug_mode = false;

	dump.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = "dump";
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
					if (dump.debug_mode) {
						log.notice(name + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		if (dump.debug_mode) {
			server.set_debug_mode(true);
		}
		testEmitter.emit('start');
	}

	/* tester.dump1 = function(errorCallback){
	var test_case = "DUMP / RESTORE are able to serialize / unserialize a simple key";
	var encoded = "";
	client.set('foo','bar');
	client.dump('foo',function(err,res){
	if(err){
	errorCallback(err);
	}
	encoded = res;
	client.del('foo');
	client.exists('foo',function(err,exist){
	if(err){
	errorCallback(err);
	}
	client.restore('foo',0,encoded,function(err,resRes){
	if(err){
	errorCallback(err);
	}
	client.ttl('foo',function(err,ttlres){
	if(err){
	errorCallback(err);
	}
	client.get('foo',function(err,res){
	try{
	if(!assert.equal(exist,0,test_case) && !assert.equal(resRes,'OK',test_case)
	&& !assert.equal(ttlres,-1,test_case) && !assert.equal(res,'bar',test_case))
	ut.pass(test_case);
	}catch(e){
	ut.pass(e,true);
	}
	testEmitter.emit('next');
	});
	})
	});
	});
	});
	};

	tester.dump2 = function (errorCallback) {
	var test_case = "RESTORE can set an arbitrary expire to the materialized key";
	client.set('foo', 'bar');
	client.dump('foo', function (err, encoded) {
	if (err) {
	errorCallback(err);
	}
	client.del('foo');
	client.restore('foo', 5000, encoded, function (err, res) {
	if (err) {
	errorCallback(err);
	}
	client.pttl('foo', function (err, ttl) {
	if (err) {
	errorCallback(err);
	}
	try {
	if (!assert(ttl >= 3000 && ttl <= 5000, test_case)) {
	client.get('foo', function (err, res) {
	if (err) {
	errorCallback(err);
	}
	if (!assert.equal(res, 'bar', test_case))
	ut.pass(test_case);
	});
	}
	} catch (e) {
	ut.fail(e, true);
	}
	testEmitter.emit('next');
	});
	});
	});
	};
	 */
	tester.dump3 = function (errorCallback) {
		var test_case = "RESTORE returns an error of the key already exists";
		client.set('foo', 'bar');
		client.restore('foo', 0, '...', function (err, res) {
			try {
				if (!assert.ok(ut.match('is busy', err), test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};

	tester.dump4 = function (errorCallback) {
		var test_case = "DUMP of non existing key returns nil"
			client.dump('nonexisting_key', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.equal(res, null, test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
	};

	tester.dump5 = function (errorCallback) {
		var test_case = "MIGRATE is able to migrate a key between two instances";
		var first = g.srv[client_pid][server_pid]['client'];
		client.set('key', 'Some Value');

		var args = {};
		args['name'] = name;
		args['tags'] = "repl";
		args['overrides'] = {};
		server1.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			var server_pid1 = res;
			var second = g.srv[client_pid][server_pid1]['client'];
			second_server_host = g.srv[client_pid][server_pid1]['host'];
			second_server_port = g.srv[client_pid][server_pid1]['port'];
			first.exists('key', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.equal(res, 1, test_case)) {
						second.exists('key', function (err, res) {
							if (err) {
								errorCallback(err);
							}
							if (res == 0) {
								client.migrate(second_server_host, second_server_port, 'key', 0, 5000, function (err, res) {
									if (err) {
										errorCallback(err);
									}
									if (res == 'OK') {
										first.exists('key', function (err, res) {
											if (err) {
												errorCallback(err);
											}
											if (res == 0) {
												second.exists('key', function (err, res) {
													if (err) {
														errorCallback(err);
													}
													if (res == 1) {
														second.get('key', function (err, res) {
															if (err) {
																errorCallback(err);
															}
															if (res == 'Some Value') {
																second.ttl('key', function (err, res) {
																	if (err) {
																		errorCallback(err);
																	}
																	try {
																		if (!assert.equal(res, -1, test_case))
																			ut.pass(test_case);
																	} catch (e) {
																		ut.fail(e, true);
																	}
																	second.end();
																	server1.kill_server(client_pid, server_pid1, function (err, res) {
																		testEmitter.emit('next');
																	});
																});
															} else {
																ut.fail("Key value: " + res + " do not match with expected value: Some Value", true);
																second.end();
																server1.kill_server(client_pid, server_pid1, function (err, res) {

																	testEmitter.emit('next');
																});
															}
														});
													} else {
														ut.fail("Key dosen't exists in second Client", true);
														second.end();
														server1.kill_server(client_pid, server_pid1, function (err, res) {

															testEmitter.emit('next');
														});
													}
												});
											} else {
												ut.fail("Key Exists in first Client", true);
												second.end();
												server1.kill_server(client_pid, server_pid1, function (err, res) {

													testEmitter.emit('next');
												});
											}
										});
									} else {
										ut.fail("Error occured while performing migrate. check the logs", true);
										second.end();
										server1.kill_server(client_pid, server_pid1, function (err, res) {

											testEmitter.emit('next');
										});
									}
								});
							} else {
								ut.fail("Key Exists in Second Client", true);
								second.end();
								server1.kill_server(client_pid, server_pid1, function (err, res) {

									testEmitter.emit('next');
								});
							}
						});
					}
				} catch (e) {
					ut.fail(e, true);
					second.end();
					server1.kill_server(client_pid, server_pid1, function (err, res) {

						testEmitter.emit('next');
					});
				}
			});
		});
	};

	tester.dump6 = function (errorCallback) {
		var test_case = "MIGRATE propagates TTL correctly";
		var first = g.srv[client_pid][server_pid]['client'];
		client.set('key', 'Some Value');

		var args = {};
		args['name'] = name;
		args['tags'] = "repl";
		args['overrides'] = {};
		server2.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}
			var server_pid1 = res;
			var second = g.srv[client_pid][server_pid1]['client'];
			second_server_host = g.srv[client_pid][server_pid1]['host'];
			second_server_port = g.srv[client_pid][server_pid1]['port'];
			first.exists('key', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (res == 1) {
						second.exists('key', function (err, res) {
							if (err) {
								errorCallback(err);
							}
							if (res == 0) {
								first.expire('key', 10);
								client.migrate(second_server_host, second_server_port, 'key', 0, 5000, function (err, res) {
									if (err) {
										errorCallback(err);
									}
									if (res == 'OK') {
										first.exists('key', function (err, res) {
											if (err) {
												errorCallback(err);
											}
											if (res == 0) {
												second.exists('key', function (err, res) {
													if (err) {
														errorCallback(err);
													}
													if (res == 1) {
														second.get('key', function (err, res) {
															if (err) {
																errorCallback(err);
															}
															if (res == 'Some Value') {
																second.ttl('key', function (err, res) {
																	if (err) {
																		errorCallback(err);
																	}
																	if (res >= 7 && res <= 10)
																		ut.pass(test_case);
																	else
																		ut.fail("Value of ttl donot match " + res, true);
																	second.end();
																	server2.kill_server(client_pid, server_pid1, function (err, res) {
																		testEmitter.emit('next');
																	});
																});
															} else {
																ut.fail("Key value: " + res + " do not match with expected value: Some Value", true);
																second.end();
																server2.kill_server(client_pid, server_pid1, function (err, res) {
																	testEmitter.emit('next');
																});
															}
														});
													} else {
														ut.fail("Key dosen't exists in second Client", true);
														second.end();
														server2.kill_server(client_pid, server_pid1, function (err, res) {
															testEmitter.emit('next');
														});
													}
												});
											} else {
												ut.fail("Key Exists in first Client", true);
												second.end();
												server2.kill_server(client_pid, server_pid1, function (err, res) {
													testEmitter.emit('next');
												});
											}
										});
									} else {
										ut.fail("Error occured while performing migrate. check the logs", true);
										second.end();
										server2.kill_server(client_pid, server_pid1, function (err, res) {
											testEmitter.emit('next');
										});
									}
								});
							} else {
								ut.fail("Key Exists in second client", true);
								second.end();
								server2.kill_server(client_pid, server_pid1, function (err, res) {
									testEmitter.emit('next');
								});
							}
						});
					} else {
						ut.fail("Key donot exist in first client", true);
						second.end();
						server2.kill_server(client_pid, server_pid1, function (err, res) {
							testEmitter.emit('next');
						});
					}
				} catch (e) {
					ut.fail(e, true);
					second.end();
					server2.kill_server(client_pid, server_pid1, function (err, res) {
						testEmitter.emit('next');
					});
				}
			});
		});
	};

	tester.dump7 = function (errorCallback) {
		var test_case = "MIGRATE can correctly transfer hashes";
		var first = g.srv[client_pid][server_pid]['client'];
		client.del('key');
		client.hmset('key', 'field1', "item 1", 'field2', "item 2", 'field3', "item 3",
			'field4', "item 4", 'field5', "item 5", 'field6', "item 6", function (err, res) {
			var args = {};
			args['name'] = name;
			args['tags'] = 'repl';
			args['overrides'] = {};
			server4.start_server(client_pid, args, function (err, res) {
				if (err) {
					errorCallback(err, null);
				}
				var server_pid1 = res;
				var second = g.srv[client_pid][server_pid1]['client'];
				second_server_host = g.srv[client_pid][server_pid1]['host'];
				second_server_port = g.srv[client_pid][server_pid1]['port'];
				first.exists('key', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					try {
						if (!assert.equal(res, 1, test_case)) {
							second.exists('key', function (err, res) {
								if (err) {
									errorCallback(err);
								}
								if (!assert.equal(res, 0, test_case)) {
									client.migrate(second_server_host, second_server_port, 'key', 0, 10000, function (err, res) {
										if (err) {
											errorCallback(err);
										}
										if (!assert.equal(res, 'OK', test_case)) {
											first.exists('key', function (err, res) {
												if (err) {
													errorCallback(err);
												}
												if (!assert.equal(res, 0, test_case)) {
													second.exists('key', function (err, res) {
														if (err) {
															errorCallback(err);
														}
														if (!assert.equal(res, 1, test_case)) {
															second.ttl('key', function (err, res) {
																if (err) {
																	errorCallback(err);
																}
																if (!assert.equal(res, -1, test_case)) {
																	ut.pass(test_case);
																	second.end();
																	server4.kill_server(client_pid, server_pid1, function (err, res) {
																		if (err) {
																			errorCallback(err);
																		};
																		testEmitter.emit('next');

																	});
																}
															});
														}
													});
												}
											});
										}
									});
								}
							});
						}
					} catch (e) {
						ut.fail(e);
						second.end();
						server4.kill_server(client_pid, server_pid1, function (err, res) {
							if (err) {
								errorCallback(err);
							};
							testEmitter.emit('next');
						});
					}
				});

			});
		});
	};

	tester.dump8 = function (errorCallback) {
		var test_case = "MIGRATE timeout actually works";
		var first = g.srv[client_pid][server_pid]['client'];
		client.set('key', "Some Value");
		var args = {};
		args['name'] = name;
		args['tags'] = 'repl';
		args['overrides'] = {};
		server5.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err, null);
			}

			var server_pid1 = res;
			var second = g.srv[client_pid][server_pid1]['client'];
			second_server_host = g.srv[client_pid][server_pid1]['host'];
			second_server_port = g.srv[client_pid][server_pid1]['port'];
			first.exists('key', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.equal(res, 1, test_case)) {
						second.exists('key', function (err, res) {
							if (err) {
								errorCallback(err);
							}
							if (!assert.equal(res, 0, test_case)) {
								var newClient = redis.createClient(second_server_port, second_server_host);
								newClient.debug('sleep', 5.0);
								setTimeout(function () {
									client.migrate(second_server_host, second_server_port, 'key', 0, 1000, function (err, res) {
										if (!assert.equal(ut.match("IOERR", err), true, test_case)) {
											ut.pass(test_case);
											newClient.end();
											second.end();
											server5.kill_server(client_pid, server_pid1, function (err, res) {
												testEmitter.emit('next');
											});
										}
									});
								}, 50);
							}
						});
					}
				} catch (e) {
					ut.fail(e, true);
					second.end();
					server5.kill_server(client_pid, server_pid1, function (err, res) {
						if (err) {
							errorCallback(err);
						}
						testEmitter.emit('next');
					});
				}
			});

		});
	};

	tester.dump9 = function (errorCallback) {
		var test_case = "MIGRATE can correctly transfer large values";
		var first = g.srv[client_pid][server_pid]['client'];
		client.del('key');
		g.asyncFor(0, 5000, function (loop) {
			client.rpush('key', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.rpush('key', ["item 1", "item 2", "item 3", "item 4", "item 5", "item 6", "item 7", "item 8", "item 9", "item 10"], function (err, res) {
					if (err) {
						errorCallback(err);
					}
					loop.next();
				});
			});
		}, function () {
			client.dump('key', function (err, res) {
				if (res.toString().length > 1024 * 64) {
					var args = {};
					args['name'] = name;
					args['tags'] = "repl";
					args['overrides'] = {};
					server3.start_server(client_pid, args, function (err, res) {
						if (err) {
							errorCallback(err, null);
						}
						var server_pid1 = res;
						var second = g.srv[client_pid][server_pid1]['client'];
						second_server_host = g.srv[client_pid][server_pid1]['host'];
						second_server_port = g.srv[client_pid][server_pid1]['port'];
						first.exists('key', function (err, res) {
							if (err) {
								errorCallback(err);
							}
							try {
								if (res == 1) {
									second.exists('key', function (err, res) {
										if (err) {
											errorCallback(err);
										}
										if (res == 0) {
											client.migrate(second_server_host, second_server_port, 'key', 0, 10000, function (err, res) {
												if (err) {
													errorCallback(err);
												}
												if (res == 'OK') {
													first.exists('key', function (err, res) {
														if (err) {
															errorCallback(err);
														}
														if (res == 0) {
															second.exists('key', function (err, res) {
																if (err) {
																	errorCallback(err);
																}
																if (res == 1) {
																	second.ttl('key', function (err, res) {
																		if (err) {
																			errorCallback(err);
																		}
																		if (res == -1) {
																			second.llen('key', function (err, res) {
																				if (err) {
																					errorCallback(err);
																				}
																				try {
																					if (!assert.equal(res, 5000 * 20, test_case))
																						ut.pass(test_case);
																				} catch (e) {
																					ut.fail(e, true);
																				}
																				server3.kill_server(client_pid, server_pid1, function (err, res) {
																					second.end();
																					testEmitter.emit('next');
																				});
																			});
																		} else {
																			ut.fail("ttl value donot match");
																			server3.kill_server(client_pid, server_pid1, function (err, res) {
																				second.end();
																				testEmitter.emit('next');
																			});
																		}
																	});
																} else {
																	ut.fail("Key dosen't exists in second Client", true);
																	server3.kill_server(client_pid, server_pid1, function (err, res) {
																		second.end();
																		testEmitter.emit('next');
																	});
																}
															});
														} else {
															ut.fail("Key Exists in first Client", true);
															server3.kill_server(client_pid, server_pid1, function (err, res) {
																second.end();
																testEmitter.emit('next');
															});
														}
													});
												} else {
													ut.fail("Error occured while performing migrate. check the logs", true);
													server3.kill_server(client_pid, server_pid1, function (err, res) {
														second.end();
														testEmitter.emit('next');
													});
												}
											});
										} else {
											ut.fail("Key Exists in second client", true);
											server3.kill_server(client_pid, server_pid1, function (err, res) {
												second.end();
												testEmitter.emit('next');
											});
										}
									});
								} else {
									ut.fail("Key donot exist in first client", true);
									server3.kill_server(client_pid, server_pid1, function (err, res) {
										second.end();
										testEmitter.emit('next');
									});
								}
							} catch (e) {
								ut.fail(e, true);
								second.end();
								server3.kill_server(client_pid, server_pid1, function (err, res) {
									if (err) {
										errorCallback(err);
									};
									testEmitter.emit('next');
								});
							}
						});
					});
				} else {
					ut.fail("key length doesn't match", true);
					testEmitter.emit('next');
				}
			});
		});
	};

	return dump;
}
	());
