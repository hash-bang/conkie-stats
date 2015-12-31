var cpuUsage = require('cpu-usage');
var os = require('os');

module.exports = {
	poll: function(finish) {
		finish(null, {
			cpu: {
				load: os.loadavg(),
				// usage: gets filled in later
			},
		});
	},
	register: function(finish, parentStats) {
		var finished = false;

		cpuUsage(1000, function(usage) {
			parentStats.update({cpu: {usage: usage}});
			if (!finished) { // Ensure we only call finish() once
				finish();
				finished = true;
			}
		});
	},
};
