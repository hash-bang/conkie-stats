var cpuUsage = require('cpu-usage');
var os = require('os');

module.exports = {
	settings: {
		cpu: {
			/**
			* Which method to use to gauge the CPU
			* 'auto' - determine based on platform
			* 'cpu-usage' - use nodeJS.OS + the cpu-usage NPM module
			* 'os-only' - only use the nodeJS.OS module
			*/
			method: 'auto',
		},
	},
	poll: function(finish) {
		finish(null, {
			cpu: {
				load: os.loadavg(),
				// usage: gets filled in later if (settings.cpu.method == auto/cpu-usage
			},
		});
	},
	register: function(finish, parentStats) {
		var finished = false;

		if (this.settings.cpu.method == 'auto') {
			this.settings.cpu.method = (os.platform() == 'linux' ? 'cpu-usage' : 'os-only');
			parentStats.emit('debug', 'Using ' + this.settings.cpu.method + ' method to retrieve cpu info');
		}

		if (this.settings.cpu.method == 'cpu-usage') {
			cpuUsage(1000, function(usage) {
				parentStats.update({cpu: {usage: usage}});
				if (!finished) { // Ensure we only call finish() once
					finish();
					finished = true;
				}
			});
		}
	},
};
