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
	
	function fourDgtBinNum(n){
		if(n == 0)
			return "0000";
		if(n>0 && n<10)
			return "000" + n;
		else if(n>9 && n<100)
			return "00" + n;
		else if(n>99 && n<1000)
			return "0" + n;	
	}
	
	function decimalToHex(num)
	{
		if (num < 0)
			num = 0xFFFFFFFF + num + 1;
		return num.toString(16).toUpperCase();
	}
			
	function count_bits(str){
		var Bin = "",HexASCII = "";
		for(var iStr = 0;iStr<str.length;iStr++){
			val = str[iStr].charCodeAt(0);
			HexASCII = decimalToHex(val);
			for(var i=0;i<HexASCII.toString().length;i++){
				switch(HexASCII.toString()[i]){
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
		return Bin.split(/1/g).length-1;
	}
	
	function simulate_bit_op(op,args){
		var maxlen = 0,j=0,count=args.length;
		for(var i=0;i<count;i++){
			
		}
	}
	return bitops;
}
	());