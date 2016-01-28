var fs = require('fs');
var os = require('os');

module.exports = {
	settings: {
		memory: {
			method: 'auto', // Which method to use (auto - auto detect, os - use nodejs.os module, proc - use /proc)
			cacheIsFree: true, // Whether 'used' and 'free' memory counts should ignore 'cache' memory (memory that is easily freed - only available when method==auto/proc)
		},
	},
	poll: function(finish) {
		switch (this.settings.memory.method) {
			case 'os':
				var free = os.freemem();
				var total = os.totalmem();

				finish(null, {
					memory: {
						free: free,
						total: total,
						used: total - free,
					},
				});
				break;
			case 'proc':
				var self = this;
				var out = {
					memory: {
						cache: undefined,
						free: undefined,
						total: undefined,
					},
				};

				var lineSplitter = /^(.+?):\s+([0-9]+) kB$/;
				var fieldMaps = {
					MemTotal: 'total',
					MemFree: 'free',
					Buffers: 'buffers',
					Cached: 'cache',
				};
				fs.readFile('/proc/meminfo', 'utf8', function(next, content) {
					content.split('\n').forEach(function(line) {
						var bits = lineSplitter.exec(line);
						if (!bits || !fieldMaps[bits[1]]) return; // Not interested in this field
						out.memory[fieldMaps[bits[1]]] = parseInt(bits[2]) * 1024;
					});

					out.memory.used = out.memory.total - out.memory.free;

					if (self.settings.memory.cacheIsFree) {
						out.memory.used -= out.memory.cache;
						out.memory.free += out.memory.cache;
					}

					finish(null, out);
				});
				break;
		}
	},
	register: function(finish, parentStats) {
		if (this.settings.memory.method == 'auto') {
			this.settings.memory.method = (os.platform() == 'linux' ? 'proc' : 'os');
			parentStats.emit('debug', 'Using ' + this.settings.memory.method + ' method to retrieve system memory');
		}
		finish();
	},
};
