var cpuUsage = require('cpu-usage');
var os = require('os');

module.exports = {
	poll: function(finish) {
		finish(null, {
			cpu: {
				load: os.loadavg(),
			},
		});
	},
	register: function(finish, parentStats) {
		cpuUsage(1000, function(usage) {
			parentStats.update({cpu: {usage: usage}});
		});
		finish();
	},
	unregister: function(finish) {
		finish();
	},
};
