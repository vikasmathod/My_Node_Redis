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
			overrides['slave-read-only'] = "no";
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

	/* tester.obuf_limits1 = function(errorCallback){
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
	console.log(c[13]);
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
	 */
	tester.obuf_limits1 = function (errorCallback) {
		var test_case = "Client output buffer hard limit is enforced";
		var reply = '';
		msg_count = 0;
		client.config('set', 'client-output-buffer-limit', 'pubsub 10 1 1', function (err, res) {
			if (err) {
				errorCallback(err);
			}
			var newClient = net.createConnection(server_port, server_host, {detect_buffers: true, return_buffers:true});
			/* newClient.on("subscribe", function (err, res) {
				
				
			});
			newClient.on("message", function (channel, message) {
				//console.log("newClient channel " + channel + ": " + message + " Time "+msg_count);
				msg_count += 1;
				if (msg_count === -1) {
					newClient.unsubscribe();
					newClient.end();
					testEmitter.emit('next');
				}
			}); */
			
			//newClient.incr("did a thing");
			var resSplit = [];
			newClient.write(ut.formatCommand(['subscribe',"a nice channel"]),function(err,res){
				g.asyncFor(0,1,function(oloop){
					g.asyncFor(0,-1,function(loop){
						client.write(ut.formatCommand(['publish',"a nice channel","I am sending a message."]), function(err,res){
							client.write(ut.formatCommand(['publish',"a nice channel", "I am sending a second message."]), function(err,res){
								client.write(ut.formatCommand(['publish',"a nice channel", "I am sending my last message."]), function(err,res){
									client.write(ut.formatCommand(['publish',"a nice channel", "I am sending my last message."]), function(err,res){
										client.write(ut.formatCommand(['publish',"a nice channel", "I am sending my last message."]), function(err,res){
											client.write(ut.formatCommand(['publish',"a nice channel", "I am sending my last message."]), function(err,rs){
												client.client('list',function(err,res){
													resSplit = res.split("\n")[1].split(" ");
													console.log(resSplit.toString())
													if(resSplit[11] == "obl=0" && resSplit[13] == "omem=0" && resSplit[14] == "events=r")
														loop.next();
													else
														loop.break();
													
												});
											});
										});
									});
								});	
							});
						});
						},function(){						
						client.client('list',function(err,res){
							console.log(res);
							oloop.next();
						}); 
					});
					},function(){
						testEmitter.emit('next');					
				});
			});
		});
	}

	return obuf_limits;
}

	())
