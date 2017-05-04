var _ = require('lodash');
var async = require('async-chainable');
var asyncExec = require('async-chainable-exec');
var os = require('os');
var which = require('which');

module.exports = {
	settings: {
		topProcessCount: 5,
		pollFrequency: {
			io: 1 * 1000,
		},
	},
	poll: function(finish) {
		var settings = this.settings;

		async()
			.use(asyncExec)
			.set('totalRead', undefined)
			.set('totalWrite', undefined)
			.set('topIO', undefined)
			.exec('iotop', [
				'sudo',
				'iotop',
				'-b',
				'-n1',
				'-o',
				'-P',
				'-k',
			])
			.then(function(next) {
				var self = this;
				var iotopSlicer = /^\s*([0-9]+)\s+(.+?)\s+(.+?)\s+([0-9\.]+) K\/s\s+([0-9\.]+) K\/s\s+([0-9\.]+) %\s+([0-9\.]+) %\s+(.*)$/;
				self.topIO = _(this.iotop)
					.map(function(line) { return line.split('\n') })
					.tap(function(lines) {
						// Process first line of output which gives us the total system I/O {{{
						var bits = /Total DISK READ\s+:\s+([0-9\.]+) K\/s\s+\|\s+Total DISK WRITE\s+:\s+([0-9\.]+) K\/s/.exec(lines[0]);
						if (bits) {
							self.totalRead = parseFloat(bits[1]);
							self.totalWrite = parseFloat(bits[2]);
						}
						// }}}
					})
					.flatten()
					.slice(3, 3 + settings.topProcessCount)
					.map(function(line) {
						var bits = iotopSlicer.exec(line);
						if (!bits) return null;
						return {
							pid: bits[1],
							// priority: bits[2],
							// user: bits[3],
							ioRead: bits[4],
							ioWrite: bits[5],
							// swapPercent: bits[6],
							// ioPercent: bits[7],
							name: bits[8],
						};
					})
					.filter()
					.value();
				next();
			})
			.end(function(err) {
				if (err) return finish(err);
				finish(null, {
					io: {
						totalRead: this.totalRead,
						totalWrite: this.totalWrite,
					},
					topIO: this.topIO,
				});
			});
	},
	register: function(finish) {
		which('iotop', function(err, path) {
			if (err) return finish('Needed stats binary `iotop` is not in PATH. Either install it or disable the `io` module');

			finish();
		});
	},
};
