var async = require('async-chainable');
var asyncExec = require('async-chainable-exec');

module.exports = {
	settings: {
		commands: {},
	},
	poll: function(finish) {
		var settings = this.settings;

		async()
			.map('output', settings.commands, function(next, command) {
				async()
					.use(asyncExec)
					.exec('output', command)
					.end(function(err) {
						if (err) return next(null, 'Error: ' + err.toString());
						if (this.output.length == 1) { // Attempt to flatten the output into a string if only one line of output
							next(null, this.output[0]);
						} else {
							next(null, this.output);
						}
					});
			})
			.end(function(err) {
				if (err) finish(err);
				finish(null, {
					commands: this.output,
				});
			});
	},
};
