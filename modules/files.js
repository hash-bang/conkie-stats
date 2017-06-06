var _ = require('lodash');
var async = require('async-chainable');
var fs = require('fs');

module.exports = {
	settings: {
		files: {},
	},
	poll: function(finish) {
		var out = {};

		async()
			.forEach(this.settings.files, function(next, path, key) {
				fs.readFile(path, 'utf8', (err, contents) => {
					if (err) {
						out[key] = err.toString();
					} else {
						out[key] = _.dropRightWhile(contents.split("\n"), line => !line);
					}
					next();
				});
			})
			.end(function(err) {
				if (err) return finish(err);
				finish(null, out);
			});
	},
	register: function(finish) {
		if (_.isEmpty(this.settings)) return finish('No files to monitor. Set the `files` settings object or disable the `files` module');
		finish();
	},
};
