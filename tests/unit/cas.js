exports.Cas = (function () {
	//private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	cas = {},
	name = "Cas",
	client = "",
	tester = {},
	server_pid = "",
	all_tests = {};

	//public property
	cas.debug_mode = false;

	//public method
	cas.start_test = function (client_pid, callback) {
		testEmitter.on('start', function () {
			// write logic to start the server here.
			var tags = "Cas";
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
					if (cas.debug_mode) {
						log.notice(name + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
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

		if (cas.debug_mode) {
			server.set_debug_mode(true);
		}

		testEmitter.emit('start');
	}

	//private methods

	tester.cas1 = function (errorCallback) {
		var test_case = "EXEC works on WATCHed key not modified";
		client.watch('x', 'y', 'z', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('k', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.multi("1", function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).ping(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).exec(function (err, res) {
					if (err) {
						errorCallback(err);
					}
					try {
						if (!assert.equal(res, "PONG", test_case)) {
							ut.pass(test_case);
							testEmitter.emit('next');
						}
					} catch (e) {
						ut.fail(e, true);
						testEmitter.emit('next');
					}
				});
			});
		});
	};

	tester.cas2 = function (errorCallback) {
		var test_case = "EXEC fail on WATCHed key modified (1 key of 1 watched)";
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
					client.multi(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).ping(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, null, test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							testEmitter.emit('next');
						}
					});
				});
			});
		});
	};

	tester.cas3 = function (errorCallback) {
		var test_case = "EXEC fail on WATCHed key modified (1 key of 5 watched)";
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
					client.multi(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).ping(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}

						try {
							if (!assert.equal(res, null, test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							testEmitter.emit('next');
						}
					});
				});
			});
		});
	};

	tester.cas4 = function (errorCallback) {
		var test_case = "After successful EXEC key is no longer watched";
		client.set('x', 30, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.multi(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).ping(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).exec(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				})
				client.set('x', 40, function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.watch('x', function (err, res) {
						if (err) {
							errorCallback(err);
						}
						client.multi(function (err, res) {
							if (err) {
								errorCallback(err);
							}
						}).ping(function (err, res) {
							if (err) {
								errorCallback(err);
							}
						}).exec(function (err, res) {
							if (err) {
								errorCallback(err);
							}
							try {
								if (!assert.equal(res, 'PONG', test_case)) {
									ut.pass(test_case);
									testEmitter.emit('next');
								}
							} catch (e) {
								ut.fail(e, true);
								testEmitter.emit('next');
							}
						});
					});
				});
			});
		});
	};

	tester.cas5 = function (errorCallback) {
		var test_case = "After failed EXEC key is no longer watched";
		client.set('x', 30, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.watch('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.set('x', 30, function (err, res) {
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
										testEmitter.emit('next');
									}
								} catch (e) {
									ut.fail(e, true);
									testEmitter.emit('next');
								}
							});
						});
					});
				});
			});
		});
	};

	tester.cas6 = function (errorCallback) {
		var test_case = "It is possible to UNWATCH";
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
						client.multi(function (err, res) {
							if (err) {
								errorCallback(err);
							}
						}).ping(function (err, res) {
							if (err) {
								errorCallback(err);
							}
						}).exec(function (err, res) {
							if (err) {
								errorCallback(err);
							}
							try {
								if (!assert.equal(res, 'PONG', test_case)) {
									ut.pass(test_case);
									testEmitter.emit('next');
								}
							} catch (e) {
								ut.fail(e, true);
								testEmitter.emit('next');
							}
						});
					});
				});
			});
		});
	};

	tester.cas7 = function (errorCallback) {
		var test_case = "UNWATCH when there is nothing watched works as expected";
		client.unwatch(function (err, res) {
			if (err) {
				errorCallback(err);
			}
			try {
				if (!assert.equal(res, 'OK', test_case)) {
					ut.pass(test_case);
					testEmitter.emit('next');
				}
			} catch (e) {
				ut.fail(e, true);
				testEmitter.emit('next');
			}
		});
	};

	tester.cas8 = function (errorCallback) {
		var test_case = "FLUSHALL is able to touch the watched keys";
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
					client.multi(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).ping(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, null, test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							testEmitter.emit('next');
						}
					});
				});
			});
		});
	};

	tester.cas9 = function (errorCallback) {
		var test_case = "FLUSHALL does not touch non affected keys";
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
					client.multi(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).ping(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, 'PONG', test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							testEmitter.emit('next');
						}
					});
				});
			});
		});
	};

	tester.cas10 = function (errorCallback) {
		var test_case = "FLUSHDB is able to touch the watched keys";
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
					client.multi(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).ping(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}

						try {
							if (!assert.equal(res, null, test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							testEmitter.emit('next');
						}
					});
				});
			});
		});
	};

	tester.cas11 = function (errorCallback) {
		var test_case = "FLUSHDB does not touch non affected keys";
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
					client.multi(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).ping(function (err, res) {
						if (err) {
							errorCallback(err);
						}
					}).exec(function (err, res) {
						if (err) {
							errorCallback(err);
						}
						try {
							if (!assert.equal(res, 'PONG', test_case)) {
								ut.pass(test_case);
								testEmitter.emit('next');
							}
						} catch (e) {
							ut.fail(e, true);
							testEmitter.emit('next');
						}
					});
				});
			});
		});
	};

	tester.cas12 = function (errorCallback) {
		var test_case = "WATCH is able to remember the DB a key belongs to";
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
								client.multi(function (err, res) {
									if (err) {
										errorCallback(err);
									}
								}).ping(function (err, res) {
									if (err) {
										errorCallback(err);
									}
								}).exec(function (err, res) {
									if (err) {
										errorCallback(err);
									}

									try {
										if (!assert.equal(res, 'PONG', test_case)) {
											ut.pass(test_case);
											testEmitter.emit('next');
										}
									} catch (e) {
										ut.fail(e, true);
										testEmitter.emit('next');
									}
								});
							});
						});
					});
				});
			});
		});
	};

	tester.cas13 = function (errorCallback) {
		var test_case = "WATCH will consider touched keys target of EXPIRE";
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
						client.multi(function (err, res) {
							if (err) {
								errorCallback(err);
							}
						}).ping(function (err, res) {
							if (err) {
								errorCallback(err);
							}
						}).exec(function (err, res) {
							if (err) {
								errorCallback(err);
							}
							try {
								if (!assert.equal(res, null, test_case)) {
									ut.pass(test_case);
									testEmitter.emit('next');
								}
							} catch (e) {
								ut.fail(e, true);
								testEmitter.emit('next');
							}
						});
					});
				});
			});
		});
	};

	tester.cas14 = function (errorCallback) {
		var test_case = "WATCH will not consider touched expired keys";
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
							client.multi(function (err, res) {
								if (err) {
									errorCallback(err);
								}
							}).ping(function (err, res) {
								if (err) {
									errorCallback(err);
								}
							}).exec(function (err, res) {
								if (err) {
									errorCallback(err);
								}
								try {
									if (!assert.equal(res, 'PONG', test_case)) {
										ut.pass(test_case);
										testEmitter.emit('next');
									}
								} catch (e) {
									ut.fail(e, true);
									testEmitter.emit('next');
								}
							});
						}, 1100);
					});
				});
			});
		});
	};
	tester.cas15 = function (errorCallback) {
		var test_case = "DISCARD should clear the WATCH dirty flag on the client";
		client.watch('x', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.set('x', 10, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.multi(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).discard(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).multi(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).incr('x', function (err, res) {
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
							testEmitter.emit('next');
						}
					} catch (e) {
						ut.fail(e, true);
						testEmitter.emit('next');
					}
				});
			});
		});
	};

	tester.cas16 = function (errorCallback) {
		var test_case = "DISCARD should UNWATCH all the keys";
		client.watch('x', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.set('x', 10, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.multi(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).discard(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).set('x', 10, function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).multi(function (err, res) {
					if (err) {
						errorCallback(err);
					}
				}).incr('x', function (err, res) {
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
							testEmitter.emit('next');
						}
					} catch (e) {
						ut.fail(e, true);
						testEmitter.emit('next');
					}
				});
			});
		});
	};

	tester.cas17 = function (errorCallback) {
		var test_case = "DISCARD without MULTI";
		client.discard(function (err, res) {
			if (res) {
				errorCallback(res);
			}
			try {
				if (!assert.ok(ut.match("DISCARD without MULTI", err), test_case)) {
					ut.pass(test_case);
					testEmitter.emit('next');
				}
			} catch (e) {
				ut.fail(e, true);
				testEmitter.emit('next');
			}
		})
	};

	tester.cas18 = function (errorCallback) {
		var test_case = "MULTI with AOF";
		client.set('x', 10, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.multi(function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).incr('x', function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).expire('x', 5, function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).setex('y', 5, 'foobar', function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).bgrewriteaof(function (err, res) {
				if (err) {
					errorCallback(err);
				}
			}).exec(function (err, replies) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.ok(ut.match("Background append only file rewriting started", replies[3]), test_case)) {
						ut.pass(test_case);
						testEmitter.emit('next');
					}
				} catch (e) {
					ut.fail(e, true);
					testEmitter.emit('next');
				}
			})
		})
	};

	return cas;

}
	());