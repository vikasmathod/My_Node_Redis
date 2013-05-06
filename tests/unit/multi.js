exports.Multi = (function () {
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	multi = {},
	name = 'Multi',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = '',
	server_port = '',
	server_host = '',
	client_pid = '';

	multi.debug_mode = false;

	multi.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = 'multi',
			overrides = {},
			args = {};
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
					if (multi.debug_mode) {
						log.notice(name + ':Client disconnected listeting to socket : ' + g.srv[client_pid][server_pid]['host'] + ':' + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		if (multi.debug_mode) {
			server.set_debug_mode(true);
		}
		testEmitter.emit('start');
	}

	tester.multi1 = function (errorCallback) {
		var test_case = 'MUTLI / EXEC basics';
		var v = new Array();
		client.del('mylist');
		client.rpush('mylist', 'a');
		client.rpush('mylist', 'b');
		client.rpush('mylist', 'c');
		client.write(ut.formatCommand(['multi']), function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.write(ut.formatCommand(['lrange', 'mylist', '0', '-1']), function (err, res) {
				if (err) {
					errorCallback(err);
				}
				v.push(res);
				client.write(ut.formatCommand(['ping']), function (err, res) {
					if (err) {
						errorCallback(err);
					}
					v.push(res);
					client.write(ut.formatCommand(['exec']), function (err, res) {
						if (err) {
							errorCallback(err);
						}
						v.push(res);
						try {
							if (!assert.deepEqual(v, ['QUEUED', 'QUEUED', [['a', 'b', 'c'], 'PONG']], test_case)) {
								ut.pass(test_case);
							}
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	};

	tester.multi2 = function (errorCallback) {
		var test_case = 'DISCARD';
		var v = new Array();
		client.del('mylist');
		client.rpush('mylist', 'a');
		client.rpush('mylist', 'b');
		client.rpush('mylist', 'c');
		client.write(ut.formatCommand(['multi']), function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.write(ut.formatCommand(['del', 'mylist']), function (err, res) {
				if (err) {
					errorCallback(err);
				}
				v.push(res);
				client.write(ut.formatCommand(['discard']), function (err, res) {
					if (err) {
						errorCallback(err);
					}
					v.push(res);
					client.write(ut.formatCommand(['lrange', 'mylist', '0', '-1']), function (err, res) {
						if (err) {
							errorCallback(err);
						}
						v.push(res);
						try {
							if (!assert.deepEqual(v, ['QUEUED', 'OK', ['a', 'b', 'c']], test_case)) {
								ut.pass(test_case);
							}
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	};

	tester.multi3 = function (errorCallback) {
		var test_case = 'Nested MULTI are not allowed';
		var error = '';
		var multi = client.multi();
		multi.multi(function (err, res) {
			error = err;
		});
		multi.exec(function (err, res) {
			try {
				if (!assert.ok(ut.match('ERR MULTI', error), test_case)) {
					ut.pass(test_case);
				}
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};

	tester.multi4 = function (errorCallback) {
		var list = new Array();
		var test_case = 'MULTI where commands alter argc/argv';
		client.sadd('myset', 'a', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			var multi = client.multi();
			multi.spop('myset', function (err, res) {});
			multi.exec(function (err, res) {
				if (err) {
					errorCallback(err);
				}
				list[0] = res;
				client.exists('myset', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					list[1] = res;
					try {
						if (!assert.deepEqual(list, [['a'], '0'], test_case)) {
							ut.pass(test_case);
						}
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	tester.multi5 = function (errorCallback) {
		var test_case = 'WATCH inside MULTI is not allowed';
		var error = '';
		var multi = client.multi();
		multi.watch('x', function (err, res) {
			error = err;
		});
		multi.exec(function (err, res) {
			try {
				if (!assert.ok(ut.match('ERR WATCH', error), test_case)) {
					ut.pass(test_case);
				}
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};

	tester.multi6 = function (errorCallback) {
		var test_case = 'EXEC fails if there are errors while queueing commands #1';
		client.del('foo1', 'foo2');
		client.write(ut.formatCommand(['multi']), function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.write(ut.formatCommand(['set', 'foo1', 'bar1']), function (err, res) {
				if (err) {
					errorCallback(err);
				}

				client.write(ut.formatCommand(['non-existing-command']), function (err, res) {
					client.write(ut.formatCommand(['set', 'foo2', 'bar3']), function (err, res) {
						client.write(ut.formatCommand(['exec']), function (err, res) {
							try {
								if (!assert.ok(ut.match('EXECABORT', err), test_case)) {
									client.exists('foo1', function (err, res1) {
										client.exists('foo2', function (err, res2) {
											try {
												if (!assert.equal(res1, 0, test_case) && !assert.equal(res2, 0, test_case)) {
													ut.pass(test_case);
												}
											} catch (e) {
												ut.fail(e, true)
											}
											testEmitter.emit('next');
										});
									});
								}
							} catch (e) {
								ut.fail(e, true)
								testEmitter.emit('next');
							}
						});
					});
				});
			});
		});
	}

	tester.multi7 = function (errorCallback) {
		var test_case = 'EXEC fails if there are errors while queueing commands #2';
		var newClient = redis.createClient(server_port, server_host);
		client.del('foo1', 'foo2');
		client.write(ut.formatCommand(['multi']), function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.write(ut.formatCommand(['set', 'foo1', 'bar1']), function (err, res) {
				if (err) {
					errorCallback(err);
				}
				newClient.config('set', 'maxmemory', 1, function (err, res) {
					try {
						if (!assert.equal(res, 'OK', test_case)) {
							client.write(ut.formatCommand(['lpush', 'mylist', 'myvalue']), function (err, res) {
								newClient.config('set', 'maxmemory', 0, function (err, res) {
									try {
										if (!assert.equal(res, 'OK', test_case)) {
											client.write(ut.formatCommand(['set', 'foo2', 'bar2']), function (err, res) {
												if (err) {
													errorCallback(err);
												}
												client.write(ut.formatCommand(['exec']), function (err, res) {
													try {
														if (!assert.ok(ut.match('EXECABORT', err), test_case)) {
															newClient.end();
															client.exists('foo1', function (err, res1) {
																client.exists('foo2', function (err, res2) {
																	try {
																		if (!assert.equal(res1, 0, test_case) && !assert.equal(res2, 0, test_case)) {
																			ut.pass(test_case);
																		}
																	} catch (e) {
																		ut.fail(e, true)
																	}
																	testEmitter.emit('next');
																});
															});
														}
													} catch (e) {
														ut.fail(e, true)
														testEmitter.emit('next');
													}
												});
											});
										}
									} catch (e) {
										ut.fail(e, true)
										testEmitter.emit('next');
									}
								});
							});
						}
					} catch (e) {
						ut.fail(e, true);
						testEmitter.emit('next');
					}
				});
			});
		});
	};

	tester.multi8 = function (errorCallback) {
		var test_case = 'If EXEC aborts, the client MULTI state is cleared';
		client.del('foo1', 'foo2');
		client.write(ut.formatCommand(['multi']), function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.write(ut.formatCommand(['set', 'foo1', 'bar1']), function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.write(ut.formatCommand(['non-existing-command']), function (err, res) {
					client.write(ut.formatCommand(['set', 'foo2', 'bar2']), function (err, res) {
						client.write(ut.formatCommand(['exec']), function (err, res) {
							try {
								if (!assert.ok(ut.match('EXECABORT', err), test_case)) {
									client.ping(function (err, res1) {
										try {
											if (!assert.equal(res1, 'PONG', test_case)) {
												ut.pass(test_case);
											}
										} catch (e) {
											ut.fail(e, true)
										}
										testEmitter.emit('next');
									});
								}
							} catch (e) {
								ut.fail(e, true)
								testEmitter.emit('next');
							}
						});
					});
				});
			});
		});
	}

	tester.multi9 = function (errorCallback) {
		var test_case = 'EXEC works on WATCHed key not modified';
		client.watch('x', 'y', 'z');
		client.watch('k');
		var multiOp = client.multi();
		multiOp.ping();
		multiOp.exec(function (err, res) {
			try {
				if (!assert.equal(res, 'PONG', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.multi10 = function (errorCallback) {
		var test_case = 'EXEC fail on WATCHed key modified (1 key of 1 watched)';
		client.set('x', 30);
		client.watch('x');
		client.set('x', 40);
		var multiOp = client.multi();
		multiOp.ping();
		multiOp.exec(function (err, res) {
			try {
				if (!assert.equal(res, null, test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	}

	tester.multi11 = function (errorCallback) {
		var test_case = 'EXEC fail on WATCHed key modified (1 key of 5 watched)';
		client.set('x', 30, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('a', 'b', 'x', 'k', 'z', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.set('x', 40, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.multi().ping().exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, null, test_case)) {
								ut.pass(test_case);
							}
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	};

	tester.multi12 = function (errorCallback) {
		var test_case = 'EXEC fail on WATCHed key modified by SORT with STORE even if the result is empty';
		client.flushdb();
		client.lpush('foo', 'bar', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('foo');
			client.sort('emptylist', 'store', 'foo', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				var multiOp = client.multi();
				multiOp.ping();
				multiOp.exec(function (err, res) {
					try {
						if (!assert.equal(res, null, test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	tester.multi13 = function (errorCallback) {
		var test_case = 'After successful EXEC key is no longer watched';
		client.set('x', 30);
		client.watch('x');
		var multiOp = client.multi();
		multiOp.ping();
		multiOp.exec();
		client.set('x', 30);
		client.watch('x');
		multiOp = client.multi();
		multiOp.ping();
		multiOp.exec(function (err, res) {
			try {
				if (!assert.equal(res, 'PONG', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};

	tester.multi14 = function (errorCallback) {
		var test_case = 'After failed EXEC key is no longer watched';
		client.set('x', 30, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.set('x', 40, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.multi().ping().exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						client.set('x', 40, function (err, res) {
							if (err) {
								errorCallback(err);
							}
							client.multi().ping().exec(function (err, res) {
								if (err) {
									errorCallback(err);
								}
								try {
									if (!assert.equal(res, 'PONG', test_case)) {
										ut.pass(test_case);
									}
								} catch (e) {
									ut.fail(e, true);
								}
								testEmitter.emit('next');
							});
						});
					});
				});
			});
		});
	};

	tester.multi15 = function (errorCallback) {
		var test_case = 'It is possible to UNWATCH';
		client.set('x', 30, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.set('x', 40, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.unwatch(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						client.multi().ping().exec(function (err, res) {
							if (err) {
								errorCallback(err);
							}
							try {
								if (!assert.equal(res, 'PONG', test_case)) {
									ut.pass(test_case);
								}
							} catch (e) {
								ut.fail(e, true);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	};

	tester.multi16 = function (errorCallback) {
		var test_case = 'UNWATCH when there is nothing watched works as expected';
		client.unwatch(function (err, res) {
			if (err) {
				errorCallback(err);
			}
			try {
				if (!assert.equal(res, 'OK', test_case)) {
					ut.pass(test_case);
				}
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};

	tester.multi17 = function (errorCallback) {
		var test_case = 'FLUSHALL is able to touch the watched keys';
		client.set('x', 30, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.flushall(function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.multi().ping().exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, null, test_case)) {
								ut.pass(test_case);
							}
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	};

	tester.multi18 = function (errorCallback) {
		var test_case = 'FLUSHALL does not touch non affected keys';
		client.del('x', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.flushall(function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.multi().ping().exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, 'PONG', test_case)) {
								ut.pass(test_case);
							}
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	};

	tester.multi19 = function (errorCallback) {
		var test_case = 'FLUSHDB is able to touch the watched keys';
		client.set('x', '30', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.flushdb(function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.multi().ping().exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, null, test_case)) {
								ut.pass(test_case);
							}
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	};

	tester.multi20 = function (errorCallback) {
		var test_case = 'FLUSHDB does not touch non affected keys';
		client.del('x', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.flushdb(function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.multi().ping().exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, 'PONG', test_case)) {
								ut.pass(test_case);
							}
						} catch (e) {
							ut.fail(e, true);
						}
						testEmitter.emit('next');
					});
				});
			});
		});
	};

	tester.multi21 = function (errorCallback) {
		var test_case = 'WATCH is able to remember the DB a key belongs to';
		client.select(5, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.set('x', 30, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.watch('x', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.select(1, function (err, res) {
						if (err) {
							errorCallback(err);
						}
						client.set('x', 10, function (err, res) {
							if (err) {
								errorCallback(err);
							}
							client.select(5, function (err, res) {
								if (err) {
									errorCallback(err);
								}
								client.multi().ping().exec(function (err, res) {
									if (err) {
										errorCallback(err);
									}
									try {
										if (!assert.equal(res, 'PONG', test_case)) {
											ut.pass(test_case);
										}
									} catch (e) {
										ut.fail(e, true);
									}
									testEmitter.emit('next');
								});
							});
						});
					});
				});
			});
		});
	};

	tester.multi22 = function (errorCallback) {
		var test_case = 'WATCH will consider touched keys target of EXPIRE';
		client.del('x', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.set('x', 'foo', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.watch('x', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.expire('x', 10, function (err, res) {
						if (err) {
							errorCallback(err);
						}
						client.multi().ping().exec(function (err, res) {
							if (err) {
								errorCallback(err);
							}
							try {
								if (!assert.equal(res, null, test_case)) {
									ut.pass(test_case);
								}
							} catch (e) {
								ut.fail(e, true);
							}
							testEmitter.emit('next');
						});
					});
				});
			});
		});
	};

	tester.multi23 = function (errorCallback) {
		var test_case = 'WATCH will not consider touched expired keys';
		client.del('x', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.set('x', 'foo', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.expire('x', 1, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.watch('x', function (err, res) {
						if (err) {
							errorCallback(err);
						}
						setTimeout(function () {
							client.multi().ping().exec(function (err, res) {
								if (err) {
									errorCallback(err);
								}
								try {
									if (!assert.equal(res, 'PONG', test_case)) {
										ut.pass(test_case);
									}
								} catch (e) {
									ut.fail(e, true);
								}
								testEmitter.emit('next');
							});
						}, 1100);
					});
				});
			});
		});
	};

	tester.multi24 = function (errorCallback) {
		var test_case = 'DISCARD should clear the WATCH dirty flag on the client';
		client.watch('x', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.set('x', 10, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.multi().discard(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).multi().incr('x', function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).exec(function (err, res) {
					if (err) {
						errorCallback(err);
					}
					try {
						if (!assert.equal(res, 11, test_case)) {
							ut.pass(test_case);
						}
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	tester.multi25 = function (errorCallback) {
		var test_case = 'DISCARD should UNWATCH all the keys';
		client.watch('x', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.set('x', 10, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.multi().discard(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).set('x', 10, function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).multi().incr('x', function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).exec(function (err, res) {
					if (err) {
						errorCallback(err);
					}
					try {
						if (!assert.equal(res, 11, test_case)) {
							ut.pass(test_case);
						}
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	return multi;
}

	())