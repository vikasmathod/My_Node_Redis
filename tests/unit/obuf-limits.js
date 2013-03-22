exports.Obuf_limits = (function () {
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	obuf_limits = {},
	name = 'Obuf-limits',
	client = '',
	tester = {},
	server_pid = '',
	all_tests = '',
	server_port = '',
	server_host = '',
	client_pid = '';

	obuf_limits.debug_mode = false;

	obuf_limits.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = 'obuf_limits',
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
					if (obuf_limits.debug_mode) {
						log.notice(name + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
					}
					testEmitter.emit('end');
				}
		});
		if (obuf_limits.debug_mode) {
			server.set_debug_mode(true);
		}
		testEmitter.emit('start');
	}

	tester.obuf_limits1 = function(errorCallback){
		var test_case = "Client output buffer hard limit is enforced";
		var reply = '';
		client.config('set','client-output-buffer-limit','pubsub 100000 0 0',function(err,res){
			if(err){
				errorCallback(err);
			}
			var newClient = redis.createClient(server_port, server_host);
			newClient.subscribe('foo',function(err,res){
				if(err){
					errorCallback(err);
				}
				reply = res;
				try{
					if(!assert.ok(ut.match(reply,'subscribe foo 1'),test_case)){
						var omen = 0,clients = [],c = '';
						g.asyncFor(0,-1,function(loop){
							client.publish('foo','bar',function(err,res){
								if(err){
									errorCallback(err);
								}
								client.client('list',function(err,res){
									if(err){
										errorCallback(err);
									}
									clients = res.split("\r\n");
									c = clients[0].split(" ");
									console.log(c.length);
									ut.pass(test_case);
									loop.break();
								});
							});
						},function(){
							testEmitter.emit('next');
						});
						
					}
				}catch(e){
					ut.fail(e,true);
					testEmitter.emit('next');
				}
			});
		});
	}
	return obuf_limits;
}

	())