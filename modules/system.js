var os = require('os');

module.exports = {
	poll: function(finish) {
		finish(null, {
			system: {
				arch: os.arch(),
				hostname: os.hostname(),
				platform: os.platform(),
				uptime: os.uptime(),
			},
		});
	},
};
