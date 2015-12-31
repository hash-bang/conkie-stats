var async = require('async-chainable');
var asyncExec = require('async-chainable-exec');
var which = require('which');

module.exports = {
	poll: function(finish) {
		async()
			.use(asyncExec)
			.exec('dropbox', ['dropbox', 'status'])
			.end(function(err) {
				if (err) return finish(err);
				finish(null, {
					dropbox: this.dropbox
				});
			});
	},
	register: function(finish) {
		which('dropbox', function(err, path) {
			if (err) return finish('Needed stats binary `dropbox` is not in PATH. Either install it or disable the `dropbox` module');

			finish();
		});
	},
};
