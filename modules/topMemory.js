var _ = require('lodash');
var async = require('async-chainable');
var asyncExec = require('async-chainable-exec');
var which = require('which');

module.exports = {
	settings: {
		topProcessCount: 5,
		pollFrequency: {
			topMemory: 1 * 1000,
		},
	},
	poll: function(finish) {
		var settings = this.settings;

		async()
			.use(asyncExec)
			.exec('topOutput', [
				'top',
				'-Sb',
				'-n1',
				'-o%MEM',
			])
			.then('topMemory', function(next) {
				var topSlicer = /^\s*([0-9]+)\s+(.+?)\s+([0-9\-]+)\s+([0-9\-]+)\s+([0-9.]+[kmgtpezy]?)\s+([0-9.]+[kmgtpezy]?)\s+([0-9.]+[kmgtpezy]?)\s+(.)\s+([0-9\.]+)\s+([0-9\.]+)\s+([0-9\.:]+)\s+(.+)\s*$/;
				next(null, _(this.topOutput)
					.map(function(line) { return line.split('\n') })
					.flatten()
					.slice(7, 7 + settings.topProcessCount)
					.map(function(line) {
						var bits = topSlicer.exec(line);
						if (!bits) return null;
						return {
							pid: bits[1],
							// user: bits[2],
							priority: bits[3],
							nice: bits[4],
							// virtual: bits[5],
							// res: bits[6],
							// shr: bits[7],
							mode: bits[8],
							cpuPercent: bits[9],
							memPercent: bits[10],
							cpuTime: bits[11],
							name: bits[12],
						};
					})
					.value()
				);
			})
			.end(function(err) {
				if (err) return finish(err);
				finish(null, {
					topMemory: this.topMemory,
				});
			});
	},
	register: function(finish) {
		which('top', function(err, path) {
			if (err) return finish('Needed stats binary `top` is not in PATH. Either install it or disable the `topMemory` module');

			finish();
		});
	},
};
