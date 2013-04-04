exports.Bitops = (function () {
	// private properties
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	bitops = {},
	name = "Bitops",
	client = "",
	tester = {},
	server_pid = "",
	all_tests = "",
	client_pid = "";

	//public property
	bitops.debug_mode = false;

	//public method
	function fourDgtBinNum(n) {
		if (n == 0)
			return "0000";
		if (n > 0 && n < 10)
			return "000" + n;
		else if (n > 9 && n < 100)
			return "00" + n;
		else if (n > 99 && n < 1000)
			return "0" + n;
		else
			return n;
	}

	function decimalToHex(num) {
		if (num < 0)
			num = 0xFFFFFFFF + num + 1;
		return num.toString(16).toUpperCase();
	}

	function conv_bits(str) {
		var Bin = "",
		HexASCII = "";
		for (var iStr = 0; iStr < str.length; iStr++) {
			val = str[iStr].charCodeAt(0);
			HexASCII = decimalToHex(val);
			for (var i = 0; i < HexASCII.toString().length; i++) {
				switch (HexASCII.toString()[i]) {
				case "A":
					Bin += fourDgtBinNum(parseInt(10).toString(2));
					break;
				case "B":
					Bin += fourDgtBinNum(parseInt(11).toString(2));
					break;
				case "C":
					Bin += fourDgtBinNum(parseInt(12).toString(2));
					break;
				case "D":
					Bin += fourDgtBinNum(parseInt(13).toString(2));
					break;
				case "E":
					Bin += fourDgtBinNum(parseInt(14).toString(2));
					break;
				case "F":
					Bin += fourDgtBinNum(parseInt(15).toString(2));
					break;
				default:
					Bin += fourDgtBinNum(parseInt(HexASCII.toString()[i]).toString(2));
					break;

				}
			}
		}
		return Bin.split("").reverse().join("");
	}

	function convBin_string(binNum) {
		var charSet = "";
		var Singchar = ""
			binNum = binNum.split("").reverse().join("")
			for (var i = 0; i < binNum.length; i = i + 8) {
				Singchar = binNum.substring(i, i + 8);
				charSet += String.fromCharCode(parseInt(Singchar, 2).toString(10));
			}
			return charSet;
	}

	function count_bits(str) {
		var Bin = conv_bits(str);
		return Bin.split(/1/g).length - 1;
	}
	function simulate_bit_op(op, args) {
		var maxlen = 0;
		var j = 0;
		var count = args.length;
		var BinNum = "";
		var bArray = {};
		for (var i = 0; i < count; i++) {
			BinNum = conv_bits(args[i]);
			bArray[j] = BinNum;
			if (BinNum.toString().length > maxlen) {
				maxlen = BinNum.toString().length;
			}
			j++;
		}
		for (var j = 0; j < count; j++) {
			if (bArray[j].toString().length < maxlen) {
				bArray[j] += g.fillString(maxlen - bArray[j].toString().length)
			}
		}

		var out = "",
		bit = "",
		bit2 = "";
		for (var x = 0; x < maxlen; x++) {
			bit = bArray[0].toString().substring(x, x + 1);
			if (op == 'not') {
				bit = (bit == "1") ? 0 : 1;
			}
			for (var j = 1; j < count; j++) {
				bit2 = parseInt(bArray[j].toString().substring(x, x + 1));
				switch (op) {
				case 'and':
					bit = bit & bit2;
					break;
				case 'or':
					bit = bit | bit2;
					break;
				case 'xor':
					bit = bit^bit2;
					break;
				}
			}
			out += bit;
		}
		return convBin_string(out);
	}

	bitops.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = "bitops";
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
					if (bitops.debug_mode) {
						log.notice(name + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		if (bitops.debug_mode) {
			server.set_debug_mode(true);
		}
		testEmitter.emit('start');
	}

	tester.Bitops1 = function (errorCallback) {
		var test_case = "BITCOUNT returns 0 against non existing key";
		client.bitcount('no-key', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			try {
				if (!assert.equal(res, '0', test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};

	tester.Bitops2 = function (errorCallback) {
		//var ipArray = ["",'\xaa',"\x00\x00\xff","foobar","123"];
		var ipArray = ["", 'xaa', "x00x00xff", "foobar", "123"];
		var num = 0;
		var test_case = "";
		var iLoopIndx = "";
		g.asyncFor(0, ipArray.length, function (loop) {
			iLoopIndx = loop.iteration();
			num++;
			test_case = "BITCOUNT against test vector #" + num;
			client.set('str', ipArray[iLoopIndx], function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.bitcount('str', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					var bitCnt = count_bits(ipArray[iLoopIndx]);
					try {
						if (!assert.equal(res, bitCnt, test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					loop.next();
				});
			});
		}, function () {
			testEmitter.emit('next');
		});
	};

	tester.Bitops3 = function (errorCallback) {
		var test_case = "BITCOUNT fuzzing";
		var str = "",
		bitCnt = 0,
		test_pass = true;
		g.asyncFor(0, 100, function (loop) {
			str = ut.randstring(0, 3000, 'alpha');
			client.set('str', str, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				bitCnt = count_bits(str);
				client.bitcount('str', function (err, res) {
					try {
						if (!assert.equal(res, bitCnt, test_case)) {
							loop.next();
						}
					} catch (e) {
						test_pass = false;
						ut.fail(e, true);
						loop.break();
					}
				});
			});
		}, function () {
			if (test_pass)
				ut.pass(test_case);
			testEmitter.emit('next');
		});
	};

	tester.Bitops4 = function (errorCallback) {
		var test_case = "BITCOUNT with start, end";
		var bitCnt1 = 0,
		bitCnt2 = 0,
		bitCnt3 = 0;
		client.set('s', 'foobar', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			bitCnt1 = count_bits("foobar");
			bitCnt2 = count_bits("ooba");
			bitCnt3 = count_bits("");
			client.bitcount('s', 0, -1, function (err, res1) {
				if (err) {
					errorCallback(err);
				}
				client.bitcount('s', 1, -2, function (err, res2) {
					if (err) {
						errorCallback(err);
					}
					client.bitcount('s', -2, 1, function (err, res3) {
						if (err) {
							errorCallback(err);
						}
						client.bitcount('s', 0, 1000, function (err, res4) {
							if (err) {
								errorCallback(err);
							}
							try {
								if (!assert.equal(res1, bitCnt1, test_case) && !assert.equal(res2, bitCnt2, test_case)
									 && !assert.equal(res3, bitCnt3, test_case) && !assert.equal(res4, bitCnt1, test_case))
									ut.pass(test_case);
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

	tester.Bitops5 = function (errorCallback) {
		var test_case = "BITCOUNT syntax error #1";
		client.bitcount('s', 0, function (err, res) {
			try {
				if (!assert.equal(ut.match('syntax error', err), true, test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};

	tester.Bitops6 = function (errorCallback) {
		var test_case = "BITCOUNT regression test for github issue #582";
		client.del('str', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.setbit('foo', 0, 1, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.bitcount('foo', 0, 4294967296, function (err, res) {
					try {
						if (!assert.equal(ut.match('out of range', err), true, test_case))
							ut.pass(test_case);
					} catch (e) {
						ut.fail(e, true);
					}
					testEmitter.emit('next');
				});
			});
		});
	};

	tester.Bitops7 = function (errorCallback) {
		var test_case = "BITOP NOT (empty string)";
		client.set('s', '');
		client.bitop('not', 'dest', 's', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.get('dest', function (err, res) {
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
		});
	};

	tester.Bitops8 = function (errorCallback) {
		var test_case = "BITOP NOT (known string)";
		client.set('s', "1");
		client.bitop('not', 'dest', 's', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.getbit('dest', 7, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.equal(res, 0, test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	};

	tester.Bitops9 = function (errorCallback) {
		var test_case = "BITOP where dest and target are the same key";
		client.set('s', "1");
		client.bitop('not', 's', 's', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.getbit('s', 7, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.equal(res, 0, test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	};

	tester.Bitops10 = function (errorCallback) {
		var test_case = "BITOP AND|OR|XOR don't change the string with single input key";
		client.set('a', "\x01\x02\xff");
		client.bitop('and', 'res1', 'a', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.bitop('or', 'res2', 'a', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.bitop('xor', 'res3', 'a', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.get('res1', function (err, res1) {
						if (err) {
							errorCallback(err);
						}
						client.get('res2', function (err, res2) {
							if (err) {
								errorCallback(err);
							}
							client.get('res3', function (err, res3) {
								if (err) {
									errorCallback(err);
								}
								try {
									if (!assert.equal(res1, "\x01\x02\xff", test_case) && !assert.equal(res2, "\x01\x02\xff", test_case)
										 && !assert.equal(res3, "\x01\x02\xff", test_case))
										ut.pass(test_case);
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

	tester.Bitops11 = function (errorCallback) {
		var test_case = "BITOP missing key is considered a stream of zero";
		client.set('a', "\x01\x02\xff");
		client.bitop('and', 'no-suck-key', 'a', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.bitop('or', 'no-suck-key', 'a', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.bitop('xor', 'no-suck-key', 'a', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.get('res1', function (err, res1) {
						if (err) {
							errorCallback(err);
						}
						client.get('res2', function (err, res2) {
							if (err) {
								errorCallback(err);
							}
							client.get('res3', function (err, res3) {
								if (err) {
									errorCallback(err);
								}
								try {
									if (!assert.equal(res1, "\x01\x02\xff", test_case) && !assert.equal(res2, "\x01\x02\xff", test_case)
										 && !assert.equal(res3, "\x01\x02\xff", test_case))
										ut.pass(test_case);
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

	tester.Bitops12 = function (errorCallback) {
		var test_case = "BITOP shorter keys are zero-padded to the key with max length";
		client.set('a', "\x01\x02\xff\xff");
		client.set('b', "\x01\x02\xff");
		client.bitop('and', 'res1', 'a', 'b', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.bitop('or', 'res2', 'a', 'b', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.bitop('xor', 'res3', 'a', 'b', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					client.get('res1', function (err, res1) {
						if (err) {
							errorCallback(err);
						}
						client.get('res2', function (err, res2) {
							if (err) {
								errorCallback(err);
							}
							client.get('res3', function (err, res3) {
								if (err) {
									errorCallback(err);
								}
								try {
									if (!assert.equal(res1, "\x01\x02\xff\x00\x00", test_case) && !assert.equal(res2, "\x01\x02\xff\xff", test_case)
										 && !assert.equal(res3, "\x00\x00\x00\x00\xff", test_case))
										ut.pass(test_case);
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

	tester.Bitops13 = function (errorCallback) {
		var testArray = ['and', 'or', 'xor'];
		var test_case = "",
		ErrorMsg = "";
		var iLoopindx = 0,
		ivecLoopindx = 0;
		var vec = [],
		veckeys = [],
		str = "",
		numvec = 0;
		g.asyncFor(0, testArray.length, function (loop) {
			iLoopindx = loop.iteration();
			test_case = "BITOP " + testArray[iLoopindx] + " fuzzing";
			g.asyncFor(0, 10, function (innerloop) {
				client.flushall();
				vec =[];
				veckeys = [];
				numvec = g.randomInt(10) + 1;
				g.asyncFor(0, 2, function (vecloop) {
					ivecLoopindx = vecloop.iteration();
					//str = ut.randstring(0, 1000, 'alpha');
					str = g.randomInt(10);
					vec.push(str);
					veckeys.push("vector_" + ivecLoopindx);
					client.set("vector_" + ivecLoopindx, str, function (err, res) {
						vecloop.next();
					});
				}, function () {
					client.bitop(testArray[iLoopindx], 'target', veckeys, function (err, res) {
						if (err) {
							errorCallback(err);
						}
						var test = simulate_bit_op(testArray[iLoopindx], vec);
						var conv_String = conv_bits(test)
						iLen = conv_String.toString().length;
						strBit = "",iLoopIndex = 0;
						g.asyncFor(0,iLen,function(iloop){
							iLoopIndex = iloop.iteration();
							client.getbit('target',(iLen - iLoopIndex-1),function(err,res){
								strBit += res.toString();
								iloop.next();
							});
						},function(){
							try {
								if (!assert.equal(strBit, conv_String, test_case))
									innerloop.next();
							} catch (e) {
								ErrorMsg = e;
								innerloop.break();
							}
						});	
					});

				});
			}, function () {
				if (ErrorMsg == ""){
					ut.pass(test_case);
					loop.next();
				}
				else{
					ut.fail(ErrorMsg, true);
					loop.break();					
				}
			});
		}, function () {
			testEmitter.emit('next');
		});
	};

	tester.Bitops14 = function (errorCallback) {
		var test_case = "BITOP NOT fuzzing";
		var str = "",
		result = "",strBit = "",iLoopIndex = 0,iLen=0,errormsg = "";
		g.asyncFor(0, 5, function (loop) {
			client.flushall();
			str = ut.randstring(0, 1000, 'alpha');
			client.set('str', str, function (err, res) {
				if (err) {
					errorCallback(err);
				}
				client.bitop('not', 'target', 'str', function (err, res) {
					if (err) {
						errorCallback(err);
					}
					result = simulate_bit_op('not', [str]);
					iLen = conv_bits(result).toString().length;
					strBit = "",iLoopIndex = 0;
					g.asyncFor(0,iLen,function(iloop){
						iLoopIndex = iloop.iteration();
						client.getbit('target',(iLen - iLoopIndex-1),function(err,res){
							strBit += res.toString();
							iloop.next();
						});
					},function(){
						try {
							if (!assert.equal(convBin_string(strBit), result, test_case))	
								loop.next();
						} catch (e) {
							errormsg = e;
							loop.break();
						}

					});					
				});
			})
		}, function () {
			if(errormsg == "")
				ut.pass(test_case);
			else
				ut.fail(errormsg, true);
			testEmitter.emit('next');
		});
	};

	tester.Bitops15 = function (errorCallback) {
		var test_case = "BITOP with integer encoded source objects";
		client.set('a', 1);
		client.set('b', 2);
		client.bitop('xor', 'dest', 'a', 'b', 'a', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.get('dest', function (err, res) {
				if (err) {
					errorCallback(err);
				}
				try {
					if (!assert.equal(res, 2, test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	};

	tester.Bitops16 = function (errorCallback) {
		var test_case = "BITOP with non string source key";
		client.del('c');
		client.set('a', 1);
		client.set('b', 2);
		client.lpush('c', 'foo', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			client.bitop('xor', 'dest', 'a', 'b', 'c', 'd', function (err, res) {
				try {
					if (!assert.equal(ut.match("ERR", err), true, test_case))
						ut.pass(test_case);
				} catch (e) {
					ut.fail(e, true);
				}
				testEmitter.emit('next');
			});
		});
	};

	tester.Bitops17 = function (errorCallback) {
		var test_case = "BITOP with empty string after non empty string (issue #529)";
		client.flushdb();
		client.set('a', "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00");
		client.bitop('or', 'x', 'a', 'b', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			try {
				if (!assert.equal(res, 32, test_case))
					ut.pass(test_case);
			} catch (e) {
				ut.fail(e, true);
			}
			testEmitter.emit('next');
		});
	};

	return bitops;
}
	());
