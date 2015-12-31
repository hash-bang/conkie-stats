var os = require('os');

module.exports = {
	poll: function(finish) {
		finish(null, {
			system: {
				arch: os.arch(),
				hostname: os.hostname(),
				platform: os.platform(),
			},
		});
	},
	register: function(finish, parentStats) {
		finish();
	},
	unregister: function(finish) {
		finish();
	},
};
