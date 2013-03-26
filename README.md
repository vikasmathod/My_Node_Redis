# Prerequisites
<<<<<<< HEAD
* Node v0.7.6x or higher
* Redis Binaries from [Github][1]
=======
* [Node v0.7.6x][0] or higher
* Redis Binaries 2.6 aplha from [Github][1]
>>>>>>> Tweak for multi word commands
* [Git for Windows][2]

## Steps to Run the Tests
- Clone the project
- Complile the Redis Binaries as given in the README.
- Make a folder redis and then src inside the test_suite.
- Copy the the binaries from the Debug folder to src folder, just created.
- Make sure node, npm, and git are present in Environment Path.
- To install the dependencies first, do
	 <pre><code> npm install </code></pre>
- To run the tests just, do
	 <pre><code> npm test </code></pre>

- Alternatively, the tests can be run as:
	 <pre><code> \redisnodetest\>node test_helper.js </code></pre>
	 
- Run the bgsave using the following:
	<pre><code> \redisnodetest\>node test_bgsave.js </code></pre>

- Run the bgsaveperf using the following:
	<pre><code> \redisnodetest\>node test_bgsaveperf.js </code></pre>


#### Known Issues
- 2 Tests in Dump.js (Test on restore commands throws error and are commented for now)
- 2 Tests in Bitops.js (Fuzzing operation throws error)
- 2 Tests in Basic.js (Fuzzing operation in binary format, need to find the nodejs alternative for the same.)
- 1 test in list3.js takes more than 60 seconds to run.
- The code for returning number of test case pass/fails seems to have a bug. Will fix this asap.

#### Note
<<<<<<< HEAD
=======
- Test suites are unstable as migration to 2.6 is still under progress 
- Test suite makes use of a [modified version of node_redis][6].
>>>>>>> Tweak for multi word commands
- currently logs are are <pre><code>\tests\logs\results.log</code></pre>
- logging of all commands/data in and out or redis is encorporated, to enable , in test_helper.js set <pre><code>redis.log_to_file = true</code></pre>
- the debug log for above would be found at <pre><code>\tests\logs\redis-debug.log</code></pre>

[1]: https://github.com/MSOpenTech/redis
[2]: http://code.google.com/p/msysgit/downloads/list?q=full+installer+official+git
