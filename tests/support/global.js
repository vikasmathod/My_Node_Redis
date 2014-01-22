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

var portfinder = require('portfinder');

exports.host = '127.0.0.1';
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
	var str = '';
	for (var i = 0; i < length; i++) {
		str = str + value;
	}
	return str;
};

exports.asyncFor = function (start, iterations, func, callback) {
	var index,
	counter = 0;
	if (start === 'undefined')
		index = 0;
	else
		index = start;
	var done = false;
	var loop = {
		next : function () {
			if (done) {
				return;
			}
			if (iterations >= 0) {
				if (counter < iterations) {
					index++;
					counter++;
					func(loop);

				} else {
					done = true;
					callback();
				}
			} else {
				func(loop);
			}
		},

		iteration : function () {
			return index - 1;
		},

		decrease : function (val) {
			index = index - val;
			counter = counter - val;
		},
		updateindex : function (val) {
			index = val;
		},
		updatecounter : function (val) {
			counter = val;
		},
		break : function () {
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