var _ = require('lodash');
var async = require('async-chainable');
var asyncExec = require('async-chainable-exec');
var which = require('which');

module.exports = {
	settings: {
		pollFrequency: {
			io: 1 * 1000,
		},
	},
	poll: function(finish) {
		async()
			.use(asyncExec)
			.exec('dropbox', ['dropbox', 'status'])
			.end(function(err) {
				if (err) return finish(err);
				finish(null, {
					dropbox: _.flatten(this.dropbox.map(line => line.split('\n'))),
				});
			});
	},
	register: function(finish) {
		which('dropbox', (err, path) => {
			if (err) return finish('Needed stats binary `dropbox` is not in PATH. Either install it or disable the `dropbox` module');

			finish();
		});
	},
};
