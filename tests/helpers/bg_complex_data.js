var redis = require('redis');
var client = "";
var g = require('../support/global.js');
var Utility = require('../support/util.js'),
ut = new Utility();

function bg_complex_data(host, port, db, ops) {
	client = redis.createClient(port, host);
	client.select(db, function (err, res) {
		if (err) {
			console.log(err);
			client.end();
			process.exit();
		}
		ut.createComplexDataset(client, ops, null, function (err, res) {
			if (err) {
				console.log(err);
				client.end();
				process.exit();
			}
		});
	});
}

bg_complex_data(process.argv[2], process.argv[3], process.argv[4], process.argv[5]);