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

function ZsetUtility() {}

ZsetUtility.prototype.basics = function (client, encoding, callback) {
	if (encoding === 'ziplist') {
		client.config('set', 'zset-max-ziplist-entries', 128, function (err, res) {
			if (err) {
				callback(err, null);
			}
			client.config('set', 'zset-max-ziplist-value', 64, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			})
		})
	} else if (encoding === 'skiplist') {
		client.config('set', 'zset-max-ziplist-entries', 0, function (err, res) {
			if (err) {
				callback(err, null);
			}
			client.config('set', 'zset-max-ziplist-value', 0, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			})
		})
	} else {
		callback(new Error('Unknown sorted set encoding'), null);
	}
};
ZsetUtility.prototype.stressers = function (client, encoding, callback) {
	if (encoding === 'ziplist') {
		// Little extra to allow proper fuzzing in the sorting stresser
		client.config('set', 'zset-max-ziplist-entries', 256, function (err, res) {
			if (err) {
				callback(err, null);
			}
			client.config('set', 'zset-max-ziplist-value', 64, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			})
		})
	} else if (encoding === 'skiplist') {
		client.config('set', 'zset-max-ziplist-entries', 0, function (err, res) {
			if (err) {
				callback(err, null);
			}
			client.config('set', 'zset-max-ziplist-value', 0, function (err, res) {
				if (err) {
					callback(err, null);
				}
				callback(null, true);
			})
		})
	} else {
		callback(new Error('Unknown sorted set encoding'), null);
		// need to exit here. no callback
	}
};
ZsetUtility.prototype.zrange = function (client, args, expected, message, callback) {
	client.zrange(args, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrevrange = function (client, args, expected, message, callback) {
	client.zrevrange(args, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrank = function (client, arg1, arg2, expected, message, callback) {
	client.zrank(arg1, arg2, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrevrank = function (client, arg1, arg2, expected, message, callback) {
	client.zrevrank(arg1, arg2, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrangebyscore = function (client, args, expected, message, callback) {
	client.zrangebyscore(args, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};
ZsetUtility.prototype.zrevrangebyscore = function (client, args, expected, message, callback) {
	client.zrevrangebyscore(args, function (err, res) {
		if (err) {
			callback(err, null);
		}
		try {
			if (!assert.deepEqual(res, expected, message)) {
				callback(null, true);
			}
		} catch (e) {
			callback(e, null);
		}
	})
};

module.exports = ZsetUtility;