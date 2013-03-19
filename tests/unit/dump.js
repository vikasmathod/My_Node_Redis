exports.Dump = (function () {
	var testEmitter = new events.EventEmitter(),
	ut = new Utility(),
	server = new Server(),
	server1 = new Server(),
	dump = {},
	name = "Dump",
	client = "",
	tester = {},
	server_pid = "",
	all_tests = "",
	client_pid = "";
	
	//public property
	dump.debug_mode = false;
	
	dump.start_test = function (cpid, callback) {
		testEmitter.on('start', function () {
			var tags = "dump";
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
				if (dump.debug_mode) {
					log.notice(name + ":Client disconnected listeting to socket : " + g.srv[client_pid][server_pid]['host'] + ":" + g.srv[client_pid][server_pid]['port']);
				}
				testEmitter.emit('end');
			}
		});
		if (dump.debug_mode) {
			server.set_debug_mode(true);
		}
		testEmitter.emit('start');
	}
	
	/* tester.dump1 = function(errorCallback){
		var test_case = "DUMP / RESTORE are able to serialize / unserialize a simple key";
		var encoded = "";
		client.set('foo','bar');
		client.dump('foo',function(err,res){
			if(err){
				errorCallback(err);
			}
		    encoded = res;
			client.del('foo');
			client.exists('foo',function(err,exist){
				if(err){
					errorCallback(err);
				}
				client.restore('foo',0,encoded,function(err,resRes){
					if(err){
						errorCallback(err);
					}
					client.ttl('foo',function(err,ttlres){
						if(err){
							errorCallback(err);
						}
						client.get('foo',function(err,res){
							try{
								if(!assert.equal(exist,0,test_case) && !assert.equal(resRes,'OK',test_case)
								&& !assert.equal(ttlres,-1,test_case) && !assert.equal(res,'bar',test_case))
									ut.pass(test_case);
							}catch(e){
								ut.pass(e,true);
							}
							testEmitter.emit('next');
						});
					})
				});
			}); 
		});
	};
	 */
	/* tester.dump2 = function(errorCallback){
		client.set('foo','bar');
		client.dump('foo',function(err,encoded){
			if(err){
				errorCallback(err);
			}
			client.del('foo');
			client.restore('foo',5000,encoded,function(err,res){
				if(err){
					errorCallback(err);
				}
				client.pttl('foo',function(err,ttl){
					if(err){
						errorCallback(err);
					}
					try{
						if(!assert(ttl >= 3000 && ttl <= 5000,test_case)){
							client.get('foo',function(err,res){
								if(err){
									errorCallback(err);
								}
								if(!assert.equal(res,'bar',test_case))
									ut.pass(test_case);
							});
						}
					}catch(e){
						ut.fail(e,true);
					}
					testEmitter.emit('next');
				});
			});
		});
	};
	 */
	/* tester.dump3 = function(errorCallback){
		var test_case="RESTORE returns an error of the key already exists";
		client.set('foo','bar');
		client.restore('foo',0,'...',function(err,res){
			if(err){
				errorCallback(err);
			}
			try{
				if(assert.equal(ut.match('is busy',err),true,test_case))
					ut.pass(test_case);
			}catch(e){
				ut.fail(e,true);
			}
			testEmitter.emit('next');
		});
	}; */
	tester.dump4 = function(errorCallback){
		var test_case = "DUMP of non existing key returns nil"
		client.dump('nonexisting_key',function(err,res){
			if(err){
				errorCallback(err);
			}
			try{
				if(!assert.equal(res,null,test_case))
					ut.pass(test_case);
			}catch(e){
				ut.fail(e,true);
			}
			testEmitter.emit('next');
		});
	};
	/* tester.dump5 = function(errorCallback){
		var test_case = "MIGRATE is able to migrate a key between two instances";
		var first = g.srv[client_pid][server_pid]['client'];
		client.set('key','Some Value');
		
		var tags = "dump";
		var overrides = {};
		var args = {};
		args['name'] = name;
		args['tags'] = tags;
		args['overrides'] = overrides;
		server1.start_server(client_pid, args, function (err, res) {
			if (err) {
				errorCallback(err);
			}
			var server_pid1 = res;
			var second = g.srv[client_pid][server_pid1]['client'];
			second_server_host = g.srv[client_pid][server_pid1]['host'];
			second_server_port = g.srv[client_pid][server_pid1]['port'];
			console.log(second_server_host);
			console.log(second_server_port);
			console.log(server_port);
			first.exists('key',function(err,res){
				if (err) {
					errorCallback(err);
				}
				try{
					if(!assert.equal(res,1,test_case)){
						second.exists('key',function(err,res){
							if (err) {
								errorCallback(err);
							}
							if(!assert.equal(res,0,test_case)){
								client.migrate(second_server_host,second_server_port,'key',9,5000,function(err,res){
									if (err) {
										errorCallback(err);
									}						
									if(!assert.equal(res,'OK',test_case)){
										first.exists('key',function(err,res){
											if (err) {
												errorCallback(err);
											}
											if(!assert.equal(res,0,test_case)){
												second.exists('key',function(err,res){
													if (err) {
														errorCallback(err);
													}
													if(!assert.equal(res,1,test_case)){
														second.get('key',function(err,res){
															if (err) {
																errorCallback(err);
															}
															if(!assert.equal(res,'Some Value',test_case)){console.log(1);
																second.ttl('key',function(err,res){
																	if (err) {
																		errorCallback(err);
																	}
																	if(!assert.equal(res,-1,test_case)){
																		ut.pass(test_case);
																		second.end();
																		server1.kill_server(client_pid, server_pid1, function (err, res) {
																			ut.pass(test_case);
																			testEmitter.emit('next');
																		});
																	}
																});
															} 
														});
													}
												});
											}
										});
									}
								});
							}
						});
					}
				}catch(e){
					ut.fail(e,true);
					second.end();
					server1.kill_server(client_pid, server_pid1, function (err, res) {
						testEmitter.emit('next');
					});
				}
			});		
		});
	};
	 */
tester.dump5 = function(errorCallback){
	var test_case = "MIGRATE is able to migrate a key between two instances";
	var first = g.srv[client_pid][server_pid]['client'];
	client.set('key','Some Value');
	
	var tags = "dump";
	var overrides = {};
	var args = {};
	args['name'] = name;
	args['tags'] = tags;
	args['overrides'] = overrides;
	server1.start_server(client_pid, args, function (err, res) {
		if (err) {
			errorCallback(err);
		}
		var server_pid1 = res;
		var second = g.srv[client_pid][server_pid1]['client'];
		second_server_host = g.srv[client_pid][server_pid1]['host'];
		second_server_port = g.srv[client_pid][server_pid1]['port'];
		first.exists('key',function(err,res){
			if (err) {
				errorCallback(err);
			}
			second.exists('key',function(err,res){
				if (err) {
					errorCallback(err);
				}
				client.migrate(second_server_host,second_server_port,'key',9,5000,function(err,res){
					if (err) {
						errorCallback(err);
					}
					first.exists('key',function(err,res){
						if (err) {
							errorCallback(err);
						}
						second.exists('key',function(err,res){
							if (err) {
								errorCallback(err);
							}console.log(res)
							second.end();
							server1.kill_server(client_pid, server_pid1, function (err, res) {
								ut.pass(test_case);
								testEmitter.emit('next');
							});
						});
					});
				});
			});
			
		});		
	});
};

	
	return dump;
} ());