var portfinder = require('portfinder');

exports.host = "127.0.0.1";
exports.port = 6379;
exports.srv = {};
exports.results = {};
exports.fail_list = {};
exports.tmpcounter = 0;
exports.total_test_pass = 0;
exports.total_test_fail = 0;

exports.availablePorts = function (pid, callback) {
  portfinder.basePort = 10000 + Math.floor(Math.random() * (50000 - 10000 + 1));
  portfinder.getPort(callback);
};

exports.buffers_to_strings = function (arr) {
  return arr.map(function (val) {
    return val.toString();
  });
};

exports.fillArray = function (length, value) {
  var newArray = new Array();
  for (var i = 0; i < length; i++) {
    newArray[i] = value;
  }
  return newArray;
};

exports.fillString = function (length, value) {
  var str = "";
  for (var i = 0; i < length; i++) {
    str = str + value;
  }
  return str;
};

exports.asyncFor = function (start, iterations, func, callback) {
  var index, counter = 0;
  if (start === 'undefined') index = 0;
  else index = start;
  var done = false;
  var loop = {
    next: function () {
      if (done) {
        return;
      }
      if (iterations >= 0) {
        if (counter < iterations) {
          index++; counter++;
          func(loop);

        } else {
          done = true;
          callback();
        }
      } else {
        func(loop);
      }
    },

    iteration: function () {
      return index - 1;
    },

    decrease: function (val) {
      index = index - val;
      counter = counter - val;
    },
    updateindex: function (val) {
      index = val;
    },
    updatecounter: function (val) {
      counter = val;
    },
    break: function () {
      done = true;
      callback();
    }
  };
  loop.next();
  return loop;
};

exports.randomInt = function (max) {
  return Math.floor((Math.random() * max) + 1);
};

