# Prerequisites
* [Node v0.7.6x][0] or higher
* Redis Binaries from [Github][1]
* [Git for Windows][2]
* [Python 2.7][3]
* Microsoft Visual C++ ([Express][4] version works well)

## Prerequisites installtion
* Install Node, Git and Pyhton.
* Make sure node, npm, git and python are present in Environment Path.
* Install [node-gyp][5](node.js native addon build tool) globally, by:
	<pre><code> npm install -g node-gyp </code></pre>

	
## Steps to Run the Tests
- Clone the project
- Complile the Redis Binaries as given in the README.
- Make a folder redis and then src inside the test_suite.
- Copy the the binaries from the Debug folder to src folder, just created.
- Go back to the folder where test suite is present.
- Make sure package.json file exists in the current folder.
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
- Testcases written for obuf-limits might fail
- 1 Tests in Basic.js (Fuzzing operation, need to find alternative to Tcl Binary format B*.)
- 1 test in list3.js takes more than 60 seconds to run.
- The code for returning number of test case pass/fails seems to have a bug. Will fix this asap.

#### Note
- Test suite makes use of a [modified version of node_redis][6].
- currently logs are are <pre><code>\tests\logs\results.log</code></pre>
- logging of all commands/data in and out or redis is encorporated, to enable , in test_helper.js set <pre><code>redis.log_to_file = true</code></pre>
- the debug log for above would be found at <pre><code>\tests\logs\redis-debug.log</code></pre>