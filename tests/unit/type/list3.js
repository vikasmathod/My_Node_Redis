exports.List3 = (function () {
  //private properties
  var testEmitter = new events.EventEmitter(),
  ut = new Utility(),
  server = new Server(),
  list_common = require('./list-common.js'),
  list3 = {},
  name = "List3",
  client = "", tester = {}, server_pid = "", all_tests = {};

  //public property
  list3.debug_mode = false;

  //public method
  list3.start_test = function (client_pid, callback) {
    testEmitter.on('start', function () {
      var tags = "list ziplist";
      var overrides = {};
      overrides['list-max-ziplist-value'] = 200000;
      overrides['list-max-ziplist-entries'] = 256;
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
        if (list3.debug_mode) {
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

    if (list3.debug_mode) {
      server.set_debug_mode(true);
    }

    testEmitter.emit('start');
  }

  //private methods
  tester.List3_1 = function (errorCallback) {
    var test_case = "Explicit regression for a list bug";
    var result_array = [];
    var mylist = [];
    mylist[0] = 49376042582;
    mylist[1] = "BkG2o\pIC]4YYJa9cJ4GWZalG[4tin;1D2whSkCOW`mX;SFXGyS8sedcff3fQI^tgPCC@^Nu1J6o]meM@Lko]t_jRyo<xSJ1oObDYd`ppZuW6P@fS278YaOx=s6lvdFlMbP0[SbkI^Kr\HBXtuFaA^mDx:yzS4a[skiiPWhT<nNfAf=aQVfclcuwDrfe;iVuKdNvB9kbfq>tK?tH[\EvWqS]b`o2OCtjg:?nUTwdjpcUm]y:pg5q24q7LlCOwQE^";
    client.del('lis', function (err, res) {
      if (err) {
        errorCallback(err);
      }
      client.rpush('lis', mylist[0], function (err, res) {
        if (err) {
          errorCallback(err);
        }
        client.rpush('lis', mylist[1], function (err, res) {
          if (err) {
            errorCallback(err);
          }
          client.lindex('lis', 0, function (err, res) {
            if (err) {
              errorCallback(err);
            }
            result_array.push(res);
            client.lindex('lis', 1, function (err, res) {
              if (err) {
                errorCallback(err);
              }
              result_array.push(res);
              try {
                if ((!assert.deepEqual(result_array, [mylist[0], mylist[1]], test_case))) {
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

  tester.List3_2 = function (errorCallback) {
    var test_case = "ziplist implementation: value encoding and backlink";
    var pass_count = 0;
    var iterations = 10;
    var lis = [];
    var data = 0;
    g.asyncFor(0, iterations, function (outerloop) {
      client.del('lis', function (err, res) {
        if (err) {
          errorCallback(err);
        }
        lis = [];
        g.asyncFor(0, 200, function (innerloop1) {
          var ch = ut.randpath(new Array(1, 2, 3, 4));
          switch (ch) {
            case 1:
              data = g.fillString(g.randomInt(100000), 'x');
              break;
            case 2:
              data = g.randomInt(65536);
              break;
            case 3:
              data = g.randomInt(4294967296);
              break;
            case 4:
              data = g.randomInt(18446744073709551616);
              break;
  		case 5:
              data = -(g.randomInt(65536));
              break;
			case 6:
              data = -(g.randomInt(4294967296));
              break;
			case 7:
              data = -(g.randomInt(18446744073709551616));
              break;
          }
          lis.push(data);
          client.rpush('lis', data, function (err, res) {
            if (err) {
              errorCallback(err);
            }
            innerloop1.next();
          });
        }, function () {
          client.llen('lis', function (err, res) {
            if (err) {
              errorCallback(err);
            }
            try {
              if (!assert.deepEqual(res, lis.length, test_case)) {
                pass_count += 1;
              }
            } catch (e) {
              ut.log_error(e);
            }
            var c = 199;
            g.asyncFor(0, 200, function (innerloop2) {
              client.lindex('lis', c, function (err, res) {
                if (err) {
                  errorCallback(err);
                }
                var str1 = new String(res);
                var str2 = new String(lis[c]);
                if (str1 == str2) {
                  c -= 1;
                  innerloop2.next();
                } else {
                  client.lindex('lis', c, function (err, res) {
                    if (err) {
                      errorCallback(err);
                    }
                    var str3 = new String(res);
                    try {
                      if (!assert.deepEqual(str3, str2, test_case)) {
                        pass_count += 1;
                      }
                    } catch (e) {
                      console.log(e)
                      ut.log_error(e);
                    }
                    c -= 1;
                    innerloop2.next();
                  });
                }
              });
            }, function () {
              outerloop.next();
            });
          });
        });
      });
    }, function () {
      if (pass_count == ((200 + 1) * iterations)) {
        ut.pass(test_case);
      } else {
        ut.fail(test_case);
      }
      testEmitter.emit('next');
    });
  };
  tester.List3_3 = function (errorCallback) {
    var test_case = "ziplist implementation: encoding stress testing";
    var msg = "";
    var len = 0;
    var iterations = 200;
    var rv = [];
    var lis = [];
    g.asyncFor(0, iterations, function (outerloop) {
      client.del('lis', function (err, res) {
        if (err) { errorCallback(err); }
        lis = [];
        len = g.randomInt(400);
        g.asyncFor(0, len, function (innerloop1) {
          rv[0] = ut.randomValue();
          switch (ut.randpath(new Array(1, 2))) {
            case 1:
              lis.push(rv[0]);
              client.rpush('lis', rv[0], function () {
                if (err) {
                  errorCallback(err);
                }
                innerloop1.next();
              });
              break;
            case 2:
              lis = rv.concat(lis);
              client.lpush('lis', rv[0], function () {
                if (err) {
                  errorCallback(err);
                }
                innerloop1.next();

              });
              break;
          }
        }, function () {
          client.llen('lis', function (err, res) {
            if (err) { errorCallback(err); }
            try {
              if (!assert.deepEqual(res, lis.length, test_case)) {
              }
            } catch (e) {
              ut.log_error(e);
              msg = e;
              outerloop.break(); // break the operation and come out.
            }
            var c = 0;
            g.asyncFor(0, len, function (innerloop2) {
              client.lindex('lis', c, function (err, res) {
                if (err) {
                  errorCallback(err);
                }
                var str1 = new String(res);
                var str2 = new String(lis[c]);
                if (str1 === str2) {
                  innerloop2.next();
                } else {
                  client.lindex('lis', c, function (err, res) {
                    if (err) {
                      errorCallback(err);
                    }
                    var str3 = new String(res);
                    try {
                      if (!assert.deepEqual(str3, str2, test_case)) {
                      }
                    } catch (e) {
                      msg = e;
                      innerloop2.break(); // break the operation and come out.
                    }
                    c += 1;
                    innerloop2.next();
                  });
                }
              });
            }, function () {
              if (msg == "")
                outerloop.next();
              else
                outerloop.break();
            });
          });
        });
      });
    }, function () {
      if (msg == "") {
        ut.pass(test_case);
      } else {
        ut.fail(msg);
      }
      testEmitter.emit('next');
    });
  };

  return list3;

}());
