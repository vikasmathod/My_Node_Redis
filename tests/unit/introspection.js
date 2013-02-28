exports.Introspection = (function () {
  //private properties
  var testEmitter = new events.EventEmitter(),
  ut = new Utility(),
  server = new Server(), server2 = new Server(), server3 = new Server(), server4 = new Server(),
  server5 = new Server(), server6 = new Server(), server7_1 = new Server(), server7_2 = new Server(),
  server8 = new Server(), server9 = new Server(), server10 = new Server(),
  intro = {},
  name = "Introspection",
  client = "", tester = {}, server_pid = "", client_pid = "", all_tests = {}, server_host = "", server_port = "";

  //public property
  intro.debug_mode = false;

  //public method
  intro.start_test = function (cpid, callback) {
    testEmitter.on('start', function () {
      client_pid = cpid;
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

    if (intro.debug_mode) {
      server.set_debug_mode(true);
    }
    testEmitter.emit('start');
  }

  //private methods

  tester.introspection1 = function (errorCallback) {
    var test_case = "CLIENT LIST & KILL";
    var tags = "introspection1";
    var overrides = {};
    var args = {};
    args['name'] = name;
    args['tags'] = tags;
    args['overrides'] = overrides;
    server.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err, null);
      }
      server_pid = res;
      // we need to have a no-ready-check client, so killing here.
      g.srv[client_pid][server_pid]['client'].end();
      server_port = g.srv[client_pid][server_pid]['port'];
      server_host = g.srv[client_pid][server_pid]['host'];
      if (intro.debug_mode) {
        log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
      }
      client = redis.createClient(server_port, server_host, { no_ready_check: true });
      if (intro.debug_mode) {
        log.notice(name + ":Client connected listeting to socket : " + server_host + ":" + server_port);
      }
      client.on('ready', function () {
        var patt = "[addr=:.: fd=. age=. idle=. flags=N db=9 sub=0 psub=0 multi=0 qbuf=0  qbuf-free=. obl=0 oll=0 omem=0 events=r cmd=client.]";
        client.client('list', function (err, result1) {
          if (err) {
            errorCallback(err);
          }
          try {
            if (!assert.ok(ut.match(patt, result1), test_case)) {
              var socket = result1.slice(result1.indexOf('=') + 1, result1.indexOf(' '));
              // use client.write(<client kill : sock>) since then we can explictly ask node_redis not to retry connecting.
              client.write(ut.formatCommand(['client', 'kill', socket]), function (err, result) {
                if (err) {
                  errorCallback(err);
                }
                client.ping(function (err, res) {
                  if (res) {
                    errorCallback(res);
                  }
                  try {
                    if ((!assert.equal(result, 'OK', test_case)) && (!assert.ok(ut.match('Redis connection gone from end event', err), test_case))) {
                      ut.pass(test_case);
                      // client should be disconnected using kill command
                      if (intro.debug_mode) {
                        log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
                      }
                    }
                  } catch (e) {
                    ut.fail(e, true);
                  }
                  server.kill_server(client_pid, server_pid, function (err, res) {
                    if (err) {
                      errorCallback(err);
                    }
                    testEmitter.emit('next');
                  });
                });
              });
            }
          } catch (e) {
            ut.fail(e, true);
            client.end();
            // writing in catch since we do not want this to be executed with pass
            if (intro.debug_mode) {
              log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
            }
            server.kill_server(client_pid, server_pid, function (err, res) {
              if (err) {
                errorCallback(err);
              }
              testEmitter.emit('next');
            });
          }
        });
      });
    });
  };

  tester.introspection2 = function (errorCallback) {
    var test_case = "CONFIG - Reading full set of config values";
    var tags = "introspection2";
    var file_loc = "." + sep + "tests" + sep + "tmp" + sep + "temp-conf.conf";
    var conf_stream = fs.createWriteStream(file_loc);
    var str = "#bogus This will be skipped by the server \n\nzset-max-ziplist-value 64 \n";
    fs.writeFile(file_loc, str, function (err) {
      if (err) {
        errorCallback(err);
      }
      var overrides = {};
      if (process.platform !== 'win32') {
        overrides['unixsocket'] = "/tmp/redis.sock";
      }
      overrides['include'] = ".." + sep + "temp-conf.conf";
      overrides['maxclients'] = 32;
      overrides['maxmemory'] = "64MB";
      overrides['syslog-enabled'] = "no";
      overrides['syslog-ident'] = "redis";
      overrides['syslog-facility'] = "local4";
      overrides['rename-command'] = "CONFIG some_obscure_command";
      overrides['maxmemory-policy'] = "volatile-ttl";
      overrides['maxmemory-samples'] = 8;
      overrides['zset-max-ziplist-entries'] = 256;
      overrides['slowlog-max-len'] = 1024;
      overrides['slowlog-log-slower-than'] = 1000000;
      var args = {};
      args['name'] = name;
      args['tags'] = tags;
      args['overrides'] = overrides;
      server2.start_server(client_pid, args, function (err, res) {
        if (err) {
          errorCallback(err, null);
        }
        server_pid = res;
        client = g.srv[client_pid][server_pid]['client'];
        server_port = g.srv[client_pid][server_pid]['port'];
        server_host = g.srv[client_pid][server_pid]['host'];
        client.write(ut.formatCommand(['some_obscure_command', 'set', 'hash-max-ziplist-entries', '32']), function (err, res1) {
          if (err) {
            errorCallback(err);
          }
          client.write(ut.formatCommand(['some_obscure_command', 'get', 'hash-max-ziplist-entries']), function (err, res2) {
            if (err) {
              errorCallback(err);
            }
            client.write(ut.formatCommand(['some_obscure_command', 'get', 'zset-max-ziplist-value']), function (err, res3) {
              if (err) {
                errorCallback(err);
              }
              try {
                if ((!assert.equal(res1, 'OK', test_case)) && (!assert.equal(res2[1], 32, test_case)) && (!assert.equal(res3[1], 64, test_case))) {
                  ut.pass(test_case);
                }
              } catch (e) {
                ut.fail(e, true);
              }
              client.end();
              if (intro.debug_mode) {
                log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
              }
              server2.kill_server(client_pid, server_pid, function (err, res) {
                if (err) {
                  errorCallback(err);
                }
                testEmitter.emit('next');
              });
            });
          });
        });
      });
    });
  };

  tester.introspection3 = function (errorCallback) {
    var test_case = "Can't BGSAVE when AOF is in progress";
    var tags = "introspection4";
    var overrides = {};
    var args = {};
    args['name'] = name;
    args['tags'] = tags;
    args['overrides'] = overrides;
    server3.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err);
      }
      server_pid = res;
      client = g.srv[client_pid][server_pid]['client'];
      server_port = g.srv[client_pid][server_pid]['port'];
      server_host = g.srv[client_pid][server_pid]['host'];
      client.config('set', 'appendonly', 'yes', function (err, res) {
        if (err) {
          errorCallback(err);
        }
        client.set('foo', 'bar', function (err, res) {
          if (err) {
            errorCallback(err);
          }
          client.bgsave(function (err, res) {
            if (res) {
              errorCallback(res);
            }
            try {
              if (!assert.ok(ut.match("Can't BGSAVE while AOF log rewriting", err), test_case)) {
                ut.pass(test_case);
              }
            } catch (e) {
              ut.fail(e, true);
            }
            client.end();
            if (intro.debug_mode) {
              log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
            }
            server3.kill_server(client_pid, server_pid, function (err, res) {
              if (err) {
                errorCallback(err, null);
              }
              testEmitter.emit('next');
            });
          });
        });
      });
    });
  };

  tester.introspection4 = function (errorCallback) {
    var test_case = "Shutdown with BGSAVE";
    var tags = "introspection4";
    var overrides = {};
    var args = {};
    args['name'] = name;
    args['tags'] = tags;
    args['overrides'] = overrides;
    server4.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err);
      }
      server_pid = res;
      client = g.srv[client_pid][server_pid]['client'];
      server_port = g.srv[client_pid][server_pid]['port'];
      server_host = g.srv[client_pid][server_pid]['host'];
      client.set('foo', 'bar', function (err, res) {
        if (err) {
          errorCallback(err);
        }
        client.bgsave(function (err, res) {
          if (err) {
            errorCallback(err);
          }
          client.write(ut.formatCommand(['shutdown']), function (error, res) {
            if (res) {
              errorCallback(res);
            }
            var file = g.srv[client_pid][server_pid]['stdout'];
            fs.readFile(file, function (err, result) {
              if (err) {
                errorCallback(err);
              }
              try {
                if ((!assert.ok(ut.match("Redis is now ready to exit, bye", result), test_case)) && (!assert.ok(error, test_case))) {
                  ut.pass(test_case);
                }
              } catch (e) {
                ut.fail(e, true);
              }
              client.end();
              if (intro.debug_mode) {
                log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
              }
              testEmitter.emit('next');
              // no server to kill. Server is gone due to shutdown
            });
          });
        });
      });
    });
  };

  tester.introspection5 = function (errorCallback) {
    var test_case = "Shutdown with AOF";
    var tags = "introspection4";
    var overrides = {};
    var args = {};
    args['name'] = name;
    args['tags'] = tags;
    args['overrides'] = overrides;
    server5.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err);
      }
      server_pid = res;
      client = g.srv[client_pid][server_pid]['client'];
      server_port = g.srv[client_pid][server_pid]['port'];
      server_host = g.srv[client_pid][server_pid]['host'];
      client.config('set', 'appendonly', 'yes', function (err, res) {
        if (err) {
          errorCallback(err);
        }
        client.set('foo', 'bar', function (err, res) {
          if (err) {
            errorCallback(err);
          }
          client.bgrewriteaof(function (error1, res) {
            if (res) {
              errorCallback(res);
            }
            client.write(ut.formatCommand(['shutdown']), function (error2, res) {
              if (res) {
                errorCallback(res);
              }
              var file = g.srv[client_pid][server_pid]['stdout'];
              fs.readFile(file, function (err, result) {
                if (err) {
                  errorCallback(err);
                }
                try {
                  if ((!assert.ok(ut.match("Redis is now ready to exit, bye", result), test_case)) && (!assert.ok(error1, test_case)) && (!assert.ok(error2, test_case))) {
                    ut.pass(test_case);
                  }
                } catch (e) {
                  ut.fail(e, true);
                }
                client.end();
                if (intro.debug_mode) {
                  log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
                }
                testEmitter.emit('next');
                // no server to kill. Server is gone due to shutdown
              });
            });
          });
        });
      });
    });
  };

  tester.introspection6 = function (errorCallback) {
    var test_case = "Scheduled AOF when BGSAVE is in progress";
    var tags = "introspection6";
    var overrides = {};
    overrides['appendonly'] = 'yes';
    var args = {};
    args['name'] = name;
    args['tags'] = tags;
    args['overrides'] = overrides;
    server6.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err);
      }
      server_pid = res;
      client = g.srv[client_pid][server_pid]['client'];
      server_port = g.srv[client_pid][server_pid]['port'];
      server_host = g.srv[client_pid][server_pid]['host'];
      ut.createComplexDataset(client, 100, null, function (err, res) {
        if (err) {
          errorCallback(err);
        }
        client.bgsave(function (err, res) {
          if (err) {
            errorCallback(err);
          }
          client.bgrewriteaof(function (err, res) {
            if (err) {
              errorCallback(err);
            }
            ut.waitForBgrewriteaof(client, function (err, res) {
              if (err) {
                errorCallback(err);
              }
              setTimeout(function () {
                try {
                  if (!assert.ok(res, test_case)) {
                    ut.pass(test_case);
                  }
                } catch (e) {
                  ut.fail(e, true);
                }
                client.end();
                if (intro.debug_mode) {
                  log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
                }
                server6.kill_server(client_pid, server_pid, function (err, res) {
                  if (err) {
                    errorCallback(err);
                  }
                  testEmitter.emit('next');
                });
              }, 200);
            });
          });
        });
      });
    });
  };

  tester.introspection7 = function (errorCallback) {
    var test_case = "BGSAVE on MASTER when SLAVE is attached.";
    var tags = "introspection6";
    var overrides = {};
    var args = {};
    args['name'] = name;
    args['tags'] = tags;
    args['overrides'] = overrides;
    server7_1.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err);
      }
      var server_pid1 = res;
      var master_cli = g.srv[client_pid][server_pid1]['client'];
      var master_port = g.srv[client_pid][server_pid1]['port'];
      var master_host = g.srv[client_pid][server_pid1]['host'];
      server7_2.start_server(client_pid, args, function (err, res) {
        if (err) {
          errorCallback(err);
        }
        var server_pid2 = res;
        var slave_cli = g.srv[client_pid][server_pid2]['client'];
        var slave_port = g.srv[client_pid][server_pid2]['port'];
        var slave_host = g.srv[client_pid][server_pid2]['host'];

        slave_cli.slaveof(master_host, master_port, function (err, res) {
          if (err) {
            errorCallback(err)
          }
          ut.createComplexDataset(master_cli, 1000, null, function (err, res) {
            if (err) {
              errorCallback(err);
            }
            master_cli.bgsave(function (err, res) {
              if (err) {
                errorCallback(err);
              }
              ut.waitForBgsave(master_cli, function (err, res) {
                if (err) {
                  errorCallback(err);
                }
                try {
                  if (!assert.ok(res, test_case)) {
                    ut.pass(test_case);
                  }
                } catch (e) {
                  ut.fail(e, true);
                }
                master_cli.end();
                slave_cli.end();
                if (intro.debug_mode) {
                  log.notice(name + ":Master Client disconnected listeting to socket : " + master_host + ":" + master_port);
                  log.notice(name + ":Slave Client disconnected listeting to socket : " + slave_host + ":" + slave_port);
                }
                server7_1.kill_server(client_pid, server_pid1, function (err, res) {
                  if (err) {
                    errorCallback(err);
                  }
                  server7_2.kill_server(client_pid, server_pid2, function (err, res) {
                    if (err) {
                      errorCallback(err);
                    }
                    testEmitter.emit('next');
                  });
                });
              });
            });
          });
        });
      });
    });
  };

  tester.introspection8 = function (errorCallback) {
    var test_case = "AOF Foreground rewrite";
    var tags = "introspection8";
    var overrides = {};
    overrides['appendonly'] = 'yes';
    var args = {};
    args['name'] = name;
    args['tags'] = tags;
    args['overrides'] = overrides;
    server8.start_server(client_pid, args, function (err, res) {
      if (err) {
        errorCallback(err);
      }
      server_pid = res;
      client = g.srv[client_pid][server_pid]['client'];
      server_port = g.srv[client_pid][server_pid]['port'];
      server_host = g.srv[client_pid][server_pid]['host'];
      client.set('key1', 'barfoo', function (err, res) {
        if (err) {
          errorCallback(err);
        }
        client.bgrewriteaof(function (err, res) {
          if (err) {
            errorCallback(err);
          }
          ut.waitForBgrewriteaof(client, function (err, res) {
            if (err) {
              errorCallback(err);
            }
            setTimeout(function () {
              ut.createComplexDataset(client, 10, null, function (err, res) {
                if (err) {
                  errorCallback(err);
                }
                client.bgrewriteaof(function (err, res) {
                  if (err) {
                    errorCallback(err);
                  }
                  ut.waitForBgrewriteaof(client, function (err, res) {
                    if (err) {
                      errorCallback(err);
                    }
                    setTimeout(function () {
                      try {
                        if (!assert.ok(res, test_case)) {
                          ut.pass(test_case);
                        }
                      } catch (e) {
                        ut.fail(e, true);
                      }
                      client.end();
                      if (intro.debug_mode) {
                        log.notice(name + ":Client disconnected listeting to socket : " + server_host + ":" + server_port);
                      }
                      server8.kill_server(client_pid, server_pid, function (err, res) {
                        if (err) {
                          errorCallback(err);
                        }
                        testEmitter.emit('next');
                      });
                    }, 100);
                  });
                });
              });
            }, 100);
          });
        });
      });
    });
  };

  return intro;

}());