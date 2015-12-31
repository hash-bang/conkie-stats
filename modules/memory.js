var os = require('os');

module.exports = {
	poll: function(finish) {
		var free = os.freemem();
		var total = os.totalmem();

		finish(null, {
			memory: {
				free: free,
				total: total,
				used: total - free,
			},
		});
	},
};
