exports.Replication = (function () {
  //private properties
  var testEmitter = new events.EventEmitter(),
  ut = new Utility(),
  server = new Server(), server1 = new Server(), server2 = new Server(), server3 = new Server(),
  server4 = new Server(), server5 = new Server(), server6 = new Server(), server7 = new Server(),
  replication = {},
  name = "Replication",
  tester = {}, all_tests = {}, master_host = "", master_port = "", client_pid = "", monitor_cli = "",
  master = "", client1 = "", client2 = "", client3 = "", master_cli = "", slave_cli = "",
  load_handle0 = "", load_handle1 = "", load_handle2 = "", load_handle3 = "", load_handle4 = "",
  server_pid = "", server_pid2 = "", server_pid3 = "", server_pid4 = "";

  //public property
  replication.debug_mode = false;

  //public method
  replication.start_test = function (pid, callback) {
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

    if (replication.debug_mode) {
      server.set_debug_mode(true);
    }

    testEmitter.emit('start');
  }

  //private methods

  function start_write_load(host, port, seconds) {
    var forked = child.fork('./tests/helpers/gen_write_load.js', [host, port, seconds]);
    return forked;
  }
  function stop_write_load(handle) {
    try {
      handle.kill("SIGKILL");
    } catch (e) { }
  }
  tester.Repl3 = function (errorCallback) {
    var test_case = "Connect multiple slaves at the same time (issue #141)";
    var tags = "repl-mr31";
    var overrides = {};
    var args = {};
    args['name'] = name + "(Master)";
    args['tags'] = tags;
    args['overrides'] = overrides;
    server.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err, null);
      }
      server_pid = res;
      setTimeout(function () {
        master = g.srv[client_pid][server_pid]['client'];
        master_host = g.srv[client_pid][server_pid]['host'];
        master_port = g.srv[client_pid][server_pid]['port'];
        load_handle0 = start_write_load(master_host, master_port, 20);
        load_handle1 = start_write_load(master_host, master_port, 20);
        load_handle2 = start_write_load(master_host, master_port, 20);
        load_handle3 = start_write_load(master_host, master_port, 20);
        load_handle4 = start_write_load(master_host, master_port, 20);
        setTimeout(function () {
          var overrides = {};
          var tags = "repl-mr32";
          var args = {};
          args['name'] = name + "(Slave0)";
          args['tags'] = tags;
          args['overrides'] = overrides;
          server1.start_server(client_pid, args, function (err, res) {
            if (err) {
              errorCallback(err, null);
            }
            server_pid2 = res;
            client1 = g.srv[client_pid][server_pid2]['client'];
            setTimeout(function () {
              var overrides = {};
              var tags = "repl-mr33";
              var args = {};
              args['name'] = name + "(Slave1)";
              args['tags'] = tags;
              args['overrides'] = overrides;
              server2.start_server(client_pid, args, function (err, res) {
                if (err) {
                  errorCallback(err, null);
                }
                server_pid3 = res;
                client2 = g.srv[client_pid][server_pid3]['client'];
                setTimeout(function () {
                  var overrides = {};
                  var tags = "repl-mr34";
                  var args = {};
                  args['name'] = name + "(Slave2)";
                  args['tags'] = tags;
                  args['overrides'] = overrides;
                  server3.start_server(client_pid, args, function (err, res) {
                    if (err) {
                      errorCallback(err, null);
                    }
                    server_pid4 = res;
                    client3 = g.srv[client_pid][server_pid4]['client'];
                    start_actual_test(function (err, res) {
                      if (err) {
                        errorCallback(err)
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
            }, 100);
          });
        }, 2000);
      }, 100);
    });
    function kill_server(callback) {
      server.kill_server(client_pid, server_pid, function (err, res) {
        if (err) {
          callback(err, null);
        }
        server1.kill_server(client_pid, server_pid2, function (err, res) {
          if (err) {
            callback(err, null);
          }
          server2.kill_server(client_pid, server_pid3, function (err, res) {
            if (err) {
              callback(err, null);
            }
            server3.kill_server(client_pid, server_pid4, function (err, res) {
              if (err) {
                callback(err, null);
              }
              callback(null, true);
            });
          });
        });
      });
    };
    function start_actual_test(callback) {
      client1.slaveof(master_host, master_port, function (err, res) {
        if (err) {
          callback(err)
        }
        client2.slaveof(master_host, master_port, function (err, res) {
          if (err) {
            callback(err)
          }
          client3.slaveof(master_host, master_port, function (err, res) {
            if (err) {
              callback(err)
            }
            // Wait for all the three slaves to reach the "online" state
            var retry = 100;
            var count = 0;
            g.asyncFor(0, retry, function (loop) {
              ut.getserverInfo(master, function (err, res) {
                if (err) {
                  callback(err)
                }
                var patt = "slave0 online slave1 online slave2 online ";
                if (ut.match(patt, res)) {
                  loop.break();
                } else {
                  setTimeout(function () {
                    count++;
                    loop.next();
                  }, 100);
                }
              });
            }, function () {
              if (count == retry) {
                callback(new Error("Error:Slaves not up."));
              } else {
                // no error observed should continue.
              }
              stop_write_load(load_handle0);
              stop_write_load(load_handle1);
              stop_write_load(load_handle2);
              stop_write_load(load_handle3);
              stop_write_load(load_handle4);
              var retry = 10;
              g.asyncFor(0, retry, function (loop1) {
                var i = loop1.iteration();
                master.debug('digest', function (err, res1) {
                  if (err) {
                    callback(err);
                  }
                  client1.debug('digest', function (err, res2) {
                    if ((res1 === res2) || (i === retry)) {
                      loop1.break();
                    }
                    setTimeout(function () {
                      loop1.next();
                    }, 1000);
                  });
                });
              }, function () {
                master.debug('digest', function (err, digest) {
                  if (err) {
                    callback(err);
                  }
                  client1.debug('digest', function (err, digest0) {
                    if (err) {
                      callback(err);
                    }
                    client2.debug('digest', function (err, digest1) {
                      if (err) {
                        callback(err);
                      }
                      client3.debug('digest', function (err, digest2) {
                        if (err) {
                          callback(err);
                        }
                        try {
                          if ((!assert.notEqual(digest, '0000000000000000000000000000000000000000', test_case))
                          && (!assert.deepEqual(digest, digest0, test_case))
                          && (!assert.deepEqual(digest, digest1, test_case))
                          && (!assert.deepEqual(digest, digest2, test_case))) {
                            ut.pass(test_case);
                            client3.end();
                            client2.end();
                            client1.end();
                            master.end();
                            if (replication.debug_mode) {
                              log.notice(g.srv[client_pid][server_pid4]['name'] + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid4]['host'] + ":" + g.srv[client_pid][server_pid4]['port']);
                              log.notice(g.srv[client_pid][server_pid3]['name'] + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid3]['host'] + ":" + g.srv[client_pid][server_pid3]['port']);
                              log.notice(g.srv[client_pid][server_pid2]['name'] + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid2]['host'] + ":" + g.srv[client_pid][server_pid2]['port']);
                              log.notice(g.srv[client_pid][server_pid]['name'] + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
                            }
                            callback(null, true);
                          }
                        } catch (e) {
                          callback(e);
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    };
  };

  tester.Repl1 = function (errorCallback) {
    var tags = "repl-mr11";
    var overrides = {};
    var args = {};
    args['name'] = name + "(Master)";
    args['tags'] = tags;
    server4.start_server(client_pid, args, function (err, res) {
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
          if (replication.debug_mode) {
            log.notice("Monitor client connected  and listening on socket: " + master_port + ":" + master_host);
          }
        });
        var tags = "repl-mr12";
        var overrides = {};
        var args = {};
        args['tags'] = tags;
        args['name'] = name + "(Slave0)";
        args['overrides'] = overrides;
        server5.start_server(client_pid, args, function (err, res) {
          if (err) {
            errorCallback(err, null);
          }
          server_pid2 = res;
          slave_cli = g.srv[client_pid][server_pid2]['client'];
          start_actual_test(function (err, res) {
            if (err) {
              errorCallback(err);
            }
            monitor_cli.end();
            slave_cli.end();
            master_cli.end();
            if (replication.debug_mode) {
              log.notice("Monitor client disconnected listeting to socket : " + g.srv[client_pid][server_pid2]['host'] + ":" + g.srv[client_pid][server_pid2]['port']);
              log.notice(g.srv[client_pid][server_pid2]['name'] + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid2]['host'] + ":" + g.srv[client_pid][server_pid2]['port']);
              log.notice(g.srv[client_pid][server_pid]['name'] + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
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
      server4.kill_server(client_pid, server_pid, function (err, res) {
        if (err) {
          callback(err, null);
        } else {
          server5.kill_server(client_pid, server_pid2, function (err, res) {
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
        one: function (cb) {
          var test_case = "First server should have role slave after SLAVEOF";
          // issuing monitor here to enable monitor on master.
          monitor_cli.monitor(function (err, res) {
            if (err) {
              cb(err)
            }
          });
          slave_cli.slaveof(master_host, master_port, function (err, res) {
            if (err) {
              cb(err)
            }
            setTimeout(function () {
              ut.serverInfo(slave_cli, 'role', function (err, res) {
                if (err) {
                  cb(err)
                }
                try {
                  if (!assert.equal(res, 'slave', test_case)) {
                    ut.pass(test_case);
                  }
                } catch (e) {
                  ut.fail(e, true);
                }
                cb(null, null);
              });
            }, 1000);
          });
        },
        two: function (cb) {
          var test_case = "BRPOPLPUSH replication, when blocking against empty list";
          var client = redis.createClient(master_port, master_host);
          client.on('ready', function () {
            if (replication.debug_mode) {
              log.notice(name + ":Client connected  and listening on socket: " + master_port + ":" + master_host);
            }
          });
          client.brpoplpush('a', 'b', 5, function (err, res) {
            if (err) {
              cb(err)
            }
            master_cli.lpush('a', 'foo', function (err, res) {
              if (err) {
                cb(err)
              }
              setTimeout(function () {
                master_cli.debug('digest', function (err, digest) {
                  if (err) {
                    cb(err)
                  }
                  var retry = 10;
                  g.asyncFor(0, retry, function (loop) {
                    setTimeout(function () {
                      slave_cli.debug('digest', function (err, digest0) {
                        if (err) {
                          cb(err)
                        }
                        if (digest === digest0) {
                          loop.break();
                        }
                        loop.next();
                      });
                    }, 500);
                  }, function () {
                    master_cli.debug('digest', function (err, digest) {
                      if (err) {
                        cb(err)
                      }
                      slave_cli.debug('digest', function (err, digest0) {
                        if (err) {
                          cb(err)
                        }
                        try {
                          if (!assert.deepEqual(digest, digest0, test_case)) {
                            ut.pass(test_case);
                          }
                        } catch (e) {
                          ut.fail(e, true);
                        }
                        client.quit();
                        client.on('end', function () {
                          if (replication.debug_mode) {
                            log.notice(name + ":Client disconnected listeting to socket : " + master_host + ":" + master_port);
                          }
                        });
                        cb(null, null);
                      });
                    });
                  })
                });
              }, 1000);
            });
          });
        },
        three: function (cb) {
          var test_case = "BRPOPLPUSH replication, list exists";
          var client = redis.createClient(master_port, master_host);
          client.on('ready', function () {
            if (replication.debug_mode) {
              log.notice(name + ":Client connected  and listening on socket: " + master_port + ":" + master_host);
            }
          });
          master_cli.lpush('c', 1, function (err, res) {
            if (err) {
              cb(err)
            }
            master_cli.lpush('c', 2, function (err, res) {
              if (err) {
                cb(err)
              }
              master_cli.lpush('c', 3, function (err, res) {
                if (err) {
                  cb(err)
                }
                client.brpoplpush('a', 'b', 5, function (err, res) {
                  if (err) {
                    cb(err)
                  }
                  setTimeout(function () {
                    master_cli.debug('digest', function (err, digest) {
                      if (err) {
                        cb(err)
                      }
                      var retry = 10;
                      g.asyncFor(0, retry, function (loop) {
                        setTimeout(function () {
                          slave_cli.debug('digest', function (err, digest0) {
                            if (err) {
                              cb(err)
                            }
                            if (digest === digest0) {
                              loop.break();
                            }
                            loop.next();
                          });
                        }, 500);
                      }, function () {
                        master_cli.debug('digest', function (err, digest) {
                          if (err) {
                            cb(err)
                          }
                          slave_cli.debug('digest', function (err, digest0) {
                            if (err) {
                              cb(err)
                            }
                            try {
                              if (!assert.deepEqual(digest, digest0, test_case)) {
                                ut.pass(test_case);
                              }
                            } catch (e) {
                              ut.fail(e, true);
                            }
                            client.quit();
                            client.on('end', function () {
                              if (replication.debug_mode) {
                                log.notice(name + ":Client disconnected listeting to socket : " + master_host + ":" + master_port);
                              }
                            });
                            cb(null, null);
                          });
                        });
                      })
                    });
                  }, 1000);
                });
              });
            });
          });
        },
      }, function (err, rep) {
        if (err) {
          callback(err, null);
        }
        callback(null, true);
      });
    };

  };

  tester.Repl2 = function (errorCallback) {
    var tags = "repl-mr21";
    var overrides = {};
    var args = {};
    args['name'] = name + "(Master)";
    args['tags'] = tags;
    server6.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err, null);
      }
      server_pid = res;
      // nesting calls to start_server
      setTimeout(function () { // to give some time for the master to start.
        master_cli = g.srv[client_pid][server_pid]['client'];
        master_host = g.srv[client_pid][server_pid]['host'];
        master_port = g.srv[client_pid][server_pid]['port'];
        master_cli.set('mykey', 'foo', function (err, res) {
          if (err) {
            errorCallback(err, null);
          }
          var overrides = {};
          var tags = "repl-mr22";
          var args = {};
          args['name'] = name + "(Slave0)";
          args['overrides'] = overrides;
          args['tags'] = tags;
          server7.start_server(client_pid, args, function (err, res) {
            if (err) {
              errorCallback(err, null);
            }
            server_pid2 = res;
            slave_cli = g.srv[client_pid][server_pid2]['client'];
            slave_host = g.srv[client_pid][server_pid2]['host'];
            slave_port = g.srv[client_pid][server_pid2]['port'];
            start_actual_test(function (err, res) {
              if (err) {
                errorCallback(err);
              }
              slave_cli.end();
              master_cli.end();
              if (replication.debug_mode) {
                log.notice(g.srv[client_pid][server_pid2]['name'] + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid2]['host'] + ":" + g.srv[client_pid][server_pid2]['port']);
                log.notice(g.srv[client_pid][server_pid]['name'] + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
              }
              kill_server(function (err, res) {
                if (err) {
                  errorCallback(err)
                }
                testEmitter.emit('next');
              });
            });
          });
        });
      }, 100);
    });
    function kill_server(callback) {
      server6.kill_server(client_pid, server_pid, function (err, res) {
        if (err) {
          callback(err, null);
        } else {
          server7.kill_server(client_pid, server_pid2, function (err, res) {
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
        one: function (cb) {
          var test_case = "Second server should have role master at first";
          ut.serverInfo(slave_cli, 'role', function (err, res) {
            if (err) {
              cb(err)
            }
            try {
              if (!assert.equal(res, 'master', test_case)) {
                ut.pass(test_case);
              }
            } catch (e) {
              ut.fail(e, true);
            }
            cb(null, true);
          });
		},
		two: function (cb) {
			var test_case = "SET on the master should immediately propagate";
			slave_cli.set('mykey', 'bar', function (err, res) {
				if (err) {
					cb(err)
				}
				var delay = 100;
				setTimeout(function () {
					slave_cli.get('mykey', function (err, res) {
						if (err) {
							cb(err)
						}
						try {
							if (!assert.equal(res, 'bar', test_case)) {
								ut.pass(test_case);
							}
							} catch (e) {
							ut.fail(e, true);
						}
						cb(null, true);
					});
				}, delay);
			});
		},
        three: function (cb) {
          var test_case = "SLAVEOF should start with link status 'down'";
          slave_cli.slaveof(master_host, master_port, function (err, res) {
            if (err) {
              cb(err)
            }
            ut.serverInfo(slave_cli, 'master_link_status', function (err, res) {
              if (err) {
                cb(err)
              }
              try {
                if (!assert.equal(res, 'down', test_case)) {
                  ut.pass(test_case);
                }
              } catch (e) {
                ut.fail(e, true);
              }
              cb(null, true);
            });
          });
        },
        four: function (cb) {
          var test_case = "The role should immediately be changed to 'slave'";
          ut.serverInfo(slave_cli, 'role', function (err, res) {
            if (err) {
              cb(err)
            }
            try {
              if (!assert.equal(res, 'slave', test_case)) {
                ut.pass(test_case);
              }
            } catch (e) {
              ut.fail(e, true);
            }
            // calling wait_for_sync here so that the next test executes only after this competes.
            ut.wait_for_sync(slave_cli, function (err, res) {
              if (err) {
                cb(err)
              }
              if (res) {
                setTimeout(function () {
                  cb(null, true);
                }, 1000);
              }
            });
          });
        },
        five: function (cb) {
          var test_case = "Sync should have transferred keys from master";
          slave_cli.get('mykey', function (err, res) {
            if (err) {
              cb(err)
            }
            try {
              if (!assert.equal(res, 'foo', test_case)) {
                ut.pass(test_case);
              }
            } catch (e) {
              ut.fail(e, true);
            }
            cb(null, true);
          });
        },
        six: function (cb) {
          var test_case = "The link status should be up";
          ut.serverInfo(slave_cli, 'master_link_status', function (err, res) {
            if (err) {
              cb(err)
            }
            try {
              if (!assert.equal(res, 'up', test_case)) {
                ut.pass(test_case);
              }
            } catch (e) {
              ut.fail(e, true);
            }
            cb(null, true);
          });
        },
		seven: function (cb) {
          var test_case = "FLUSHALL should replicate";
          var result = [];
          master_cli.flushall(function (err, res) {
            if (err) {
              cb(err)
            }
            var delay = 100;
            setTimeout(function () {
              master_cli.dbsize(function (err, res) {
                if (err) {
                  cb(err)
                }
                result.push(res);
                slave_cli.dbsize(function (err, res) {
                  if (err) {
                    cb(err)
                  }
                  result.push(res);
                  try {
                    if (!assert.deepEqual(result, [0, 0], test_case)) {
                      ut.pass(test_case);
                    }
                  } catch (e) {
                    ut.fail(e, true);
                  }
                  cb(null, true);
                });
              });
            }, delay);
          });
		}, 
      }, function (err, rep) {
        if (err) {
          callback(err, null);
        }
        callback(null, true);
      });
    };

  };

  return replication;

}());