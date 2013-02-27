var redis = require('redis');
var client = "";
var g = require('../support/global.js');
var Utility = require('../support/util.js'),
    ut = new Utility();

function gen_write_load(host,port,seconds){
  client = redis.createClient(port, host);
	var start_time = new Date().getTime();
	client.select(9,function(err,res){	
		if(err){
			console.log(err);
			client.end();
			process.exit();
		}
		g.asyncFor(0,-1,function(loop){
			client.set(ut.randomValue(),ut.randomValue(),function(err,res){
				if(err){
				console.log(err);
				client.end();
				process.exit();
				}
				var end_time = new Date().getTime() - start_time;
				if(end_time > (seconds*1000)){
					loop.break();
				} else
				setTimeout(function(){ loop.next(); },0);
			});
		},function(){
			client.end();
			process.exit();
			
		});
	});
}

gen_write_load(process.argv[2],process.argv[3],process.argv[4]);