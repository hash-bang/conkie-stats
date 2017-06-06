var _ = require('lodash');
var async = require('async-chainable');
var asyncExec = require('async-chainable-exec');
var which = require('which');

module.exports = {
	settings: {
		disks: {
			ignoreTypes: [ // Ignore these filesystem types
				'tmpfs',
				'devtmpfs',
			],
			ignoreMountPrefix: [ // Ignore any filesystem who's mount point begins with these
				'/boot',
				'/proc',
			],
		},
	},
	poll: function(finish) {
		var settings = this.settings;

		async()
			.use(asyncExec)
			.exec('df', [
				'df',
				'-T',
			])
			.then('disks', function(next) {
				var dfSlicer = /^(.*?)\s+(.*?)\s+(.*?)\s+(.*?)\s+(.*?)\s+(.*?)\s+(.*)$/;

				next(null, _(this.df)
					.map(line => line.split('\n'))
					.flatten()
					.slice(1)
					.map(line => {
						var bits = dfSlicer.exec(line);
						if (!bits) return null;
						return {
							filesystem: bits[1],
							type: bits[2],
							blocks: bits[3],
							used: bits[4],
							free: bits[5],
							mount: bits[7],
						};
					})
					.filter(disk => {
						if (!disk) return false; // Invalid line read

						// Skip mount types we are ignoring
						if (settings.disks.ignoreTypes && _.includes(settings.disks.ignoreTypes, disk.type)) return false;

						// Skip mount point prefixes
						if (settings.disks.ignoreMountPrefix && _.some(settings.disks.ignoreMountPrefix, function(prefix) {
							return false;
						})) return false;

						return true;
					})
					.value()
				);
			})
			.end(function(err) {
				if (err) return finish(err);
				finish(null, {
					disks: this.disks,
				});
			});
	},
	register: function(finish) {
		which('df', (err, path) => {
			if (err) return finish('Needed stats binary `df` is not in PATH. Either install it or disable the `disks` module');

			finish();
		});
	},
};
