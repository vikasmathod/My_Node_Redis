// global scopes

child = require('child_process');
assert = require('assert');
events = require('events');
fs = require('fs');
net = require('net');
util = require('util');
path = require('path');
redis = require('redis');
redis.log_to_file = false;
async = require('async');
rimraf = require('rimraf');
Log = require('log');
sprintf = require('sprintf').sprintf;
buffertools = require('buffertools');
Buffer = require('buffer').Buffer;
g = require('./tests/support/global.js');
Utility = require('./tests/support/util.js');
Server = require('./tests/support/server.js');
sep = path.sep;

if (process.platform === 'win32') {
  REDIS_SERVER = 'redis-server.exe';
  REDIS_CHECK_AOF = 'redis-check-aof.exe';
  REDIS_CHECK_DUMP = 'redis-check-dump.exe';
  REDIS_CLI = 'redis-cli.exe';
  REDIS_BENCHMARK = 'redis-benchmark.exe';
  IS_ALIVE_CHECK = "tasklist.exe -FI \"PID eq %d\"";
} else {
  REDIS_SERVER = 'redis-server';
  REDIS_CHECK_AOF = 'redis-check-aof';
  REDIS_CHECK_DUMP = 'redis-check-dump';
  REDIS_CLI = 'redis-cli';
  REDIS_BENCHMARK = 'redis-benchmark';
  IS_ALIVE_CHECK = 'ps -p %d';
}

// global log
try {
  fs.statSync('./tests/logs');
}
catch (er) {
  fs.mkdirSync('./tests/logs');
}
log = new Log('debug', fs.createWriteStream('./tests/logs/results.log', { flags: 'a' }));

//module definition
var Test_helper = function () {
  //private properties
  var ut = new Utility(), tests = {}, all_start = 0, tests_pass = 0, tests_fail = 0, fail_list = {},
  node_child = {}, __test_list = [], client_pid = "", finish_time = {},
  start_client = false, counter = 0, test_array = [],
  numclients = 16,
  test_list = new Array(

     "unit/printver",
     "unit/auth",
     "unit/protocol",
     "unit/basic",
     "unit/type/list",
     "unit/type/list2",
     "unit/type/list3",
     "unit/type/set",
     "unit/type/zset",
     "unit/type/hash",
     "unit/sort",
     "unit/expire",
	 "unit/aofrw",
	 "unit/bitops",
	 "unit/dump",
	 "unit/limits",
	 "unit/multi",
     "unit/other",
     "unit/cas",
     "unit/quit",
     "integration/replication",
     "integration/replication-2",
	 "integration/replication-3",
	 "integration/replication-4",
     "integration/aof",
     "unit/pubsub",
     "unit/slowlog",
     "unit/maxmemory",
     "unit/introspection",
     "additional/daemonize"
  );

  //private methods

  //print help screen
  function print_help_screen() {
    console.log("\nOptions\t\tDescription\n");
    console.log("--list-tests\tList all the available test units.\n");
    console.log("--help \t\tPrint the help screen.\n");
  };
  function list_tests() {
    for (var i = 0 ; i < test_list.length ; i++) {
      console.log("Test units: " + test_list[i]);
    }
  }
 /* With the parallel test running multiple Redis instances at the same time
	 we need a fast enough computer, otherwise a lot of tests may generate
	 false positives.
	 If the computer is too slow we revert the sequetial test without any
 parallelism, that is, clients == 1.*/
	function is_a_slow_computer() {
		var start  = new Date().getTime();
		var elapsed = "";
		for(var i=0;i<1000000;j++){
			i=i;
		}
		return (new Date().getTime() - start) > 200;
	}
  //parse arguments
  for (var index = 2; index < process.argv.length ; index++) {
    var option = process.argv[index];
    if (option === '--list-tests') {
      list_tests();
      process.exit();
    }
    else if (option === '--client') {
      start_client = true;
      __test_list = process.argv[++index].split(",");
    }
    else if (option === '--help') {
      print_help_screen();
      process.exit();
    }
    else {
      console.log("Wrong Argument " + option);
      process.exit(0);
    }
  }

  // checking redis binaries & node_modules exists
  isEnvReady();

  if (start_client) {

    process.on('message', function (pid) {
      client_pid = pid;
      run_tests(__test_list.shift());
    });

  } else {

    cleanup(function (err) {
      if (err) {
        throw err;
        process.exit(1);
      }
      console.log("Cleanup Done!!");
    });
    // distribute test
    var c = 0;
    var sanitized_clients = check_sanity(numclients);
    var q = Math.floor(test_list.length / sanitized_clients);
    var r = test_list.length % sanitized_clients;
    for (var i = 0 ; i < sanitized_clients ; i++) {
      test_array[i] = new Array();
      for (var j = 0; j < q ; j++) {
        test_array[i].push(test_list[c]);
        c++;
      }
    }

    for (var k = 0; k < r; k++) {
      test_array[k].push(test_list[c]);
      c++;
    }

    g.asyncFor(0, sanitized_clients, function (loop) {
      var i = loop.iteration();
      node_child[i] = child.fork('./test_helper.js', ['--client', test_array[i]], { env: process.env, });
      setTimeout(function () {
        loop.next();
      }, 50);

      node_child[i].on('exit', function (data) {
      });

      node_child[i].on('message', function (obj) {
        counter += 1;
        tests_pass += obj.p;
        tests_fail += obj.f;
        for (k in obj.fl) {
          fail_list[k] = obj.fl[k];
        }
        node_child[i].kill('SIGTERM');
        if (counter === sanitized_clients) {
          print_result_cleanup();
        }
      });

    }, function () {
      g.asyncFor(0, sanitized_clients, function (loop) {
        var i = loop.iteration();
        node_child[i].send(node_child[i].pid);
        setTimeout(function () {
          loop.next();
        }, 3000);
      }, function () { });
    });

  }

  function print_result_cleanup() {
    util.print('\x1b[1m Test Summary \x1b[0m\n\n');
    console.log("\tTotal Tests Passed:" + tests_pass + "\n");
    console.log("\tTotal Tests Failed:" + tests_fail + "\n");
    if (tests_fail === 0) {
      console.log("\t\x1b[42m All Tests Passed \\m\/ \x1b[0m \n");
      cleanup(function (err) {
        if (err) {
          throw err;
          process.exit(1);
        }
        console.log("Cleanup Done!!");
        process.exit(0);
      });
    }
    else {
      for (hrt in fail_list) {
        if (fail_list.hasOwnProperty(hrt)) {
          console.log("\t\x1b[41m Fail \x1b[0m- " + fail_list[hrt] + "\n");
        }
      }
      console.log("\n See " + sep + "tests" + sep + "tmp directory for more.");
      process.exit(1);
    }
  }

  function cleanup(cb) {
    rimraf("." + sep + "tests" + sep + "tmp", cb);
  }

  function check_sanity(numclients) {
    if (test_list.length < numclients)
      return test_list.length;
    else
      return numclients;
  }

  function isEnvReady() {
    fs.lstat('./redis/src/' + REDIS_SERVER, function (err, stats) {
      if (err || !stats.isFile()) {
        console.log("redis-server is not present in ./redis/src.\n");
        process.exit(1);
      }
    });
    fs.lstat('./node_modules/async', function (err, stats) {
      if (err || !stats.isDirectory()) {
        console.log("async is not present in node_modules. Please do npm install.\n");
        process.exit(1);
      }
    });
    fs.lstat('./node_modules/redis', function (err, stats) {
      if (err || !stats.isDirectory()) {
        console.log("node_redis is not present in node_modules. Please do npm install.\n");
        process.exit(1);
      }
    });
    fs.lstat('./node_modules/rimraf', function (err, stats) {
      if (err || !stats.isDirectory()) {
        console.log("rimraf is not present in node_modules. Please do npm install\n.");
        process.exit(1);
      }
    });
    fs.lstat('./node_modules/portfinder', function (err, stats) {
      if (err || !stats.isDirectory()) {
        console.log("portfinder is not present in node_modules. Please do npm install.\n");
        process.exit(1);
      }
    });
    fs.lstat('./node_modules/log', function (err, stats) {
      if (err || !stats.isDirectory()) {
        console.log("log is not present in node_modules. Please do npm install.\n");
        process.exit(1);
      }
    });

  }

  process.on('uncaughtException', function (err) {
    console.error("Uncaught exception: " + err.stack);
    log.error(err.stack);
  });

  // for child nodes
  function run_tests(testFile) {
    var path = "./tests/" + testFile + ".js";
    var testName = (testFile.substr(testFile.lastIndexOf('/') + 1)).toUpperCase();
    var handle = require(path);
    var module = Object.keys(handle); // a single module is exposed {module:{}}
    log.notice("Starting " + testName);
    process.stdout.write('\n\x1b[35m [Testing] \x1b[0m: ');
    process.stdout.write('\x1b[1m' + testName + '\x1b[0m\n\n');
    finish_time[testName] = new Date().getTime();
    handle[module].debug_mode = true;
    handle[module].start_test(client_pid, function (err, res) {
      if (res) {
        finish_time[testName] = (new Date().getTime() - finish_time[testName]) / 1000;
        log.notice("Finished " + testName + " took " + finish_time[testName] + " seconds.");
        process.stdout.write('\x1b[1m [Done] : ' + testName + ' in ' + finish_time[testName] + ' sec\x1b[0m\n');
        var tname = __test_list.shift();
        if (tname)
          run_tests(tname);
        else {
          process.send({ pid: client_pid, p: ut.getPassTests(), f: ut.getFailTests(), fl: ut.getFailList() });
        }
      } else if (err) {
        console.log(err.stack);
        process.exit(1);
      }
    });
  }

}();
