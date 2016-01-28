#!/usr/bin/env node

/**
* More complex command line tool
* If you want to see simple use see ./spew.js
*/

var _ = require('lodash');
var colors = require('colors');
var conkieStats = require('./index');
var filesize = require('filesize');
var moment = require('moment');
var program = require('commander');
var util = require('util');

// Conkie Stats event handler {{{
conkieStats
	.on('error', function(err) {
		console.log(colors.red('ERROR', err));
	})
	.on('debug', function(err) {
		console.log(colors.grey('DEBUG', err));
	})
	.on('update', function(stats) {
		if (program.human) { // Convert some values to human readable
			// Convert durations {{{
			['power.0.remainingTime', 'power.0.remainingChargingTime']
				.forEach(function(path) {
					if (!_.has(stats, path)) return;

					var dur = moment.duration(_.get(stats, path), 'seconds');

					_.set(stats, path, dur.hours() + 'h ' + dur.minutes() + 'm ' + dur.seconds());
				});
			// }}}
			// Convert sizes (base 10) {{{
			['memory.total', 'memory.free', 'memory.used', 'memory.cache', 'memory.buffers']
				.forEach(function(path) {
					if (!_.has(stats, path)) return;
					_.set(stats, path, filesize(_.get(stats, path), {base: 10}));
				});
			// }}}
		}

		// Output colorful JSON structure of system information
		console.log(util.inspect(stats, {depth: null, colors: true}));
	});
// }}}

program
	.option('-h, --human', 'Try to be helpful with certain values (converts times to human readable on certain outputs')
	.option('-m, --module [mod...]', 'Specify a module to use (if omitted all are used)', function(item, value) { value.push(item); return value; }, [])
	.option('-r, --refresh [ms]', 'Refresh interval for polling modules in milliseconds', 1000)
	.option('-s, --settings [json]', 'Specify a settings object')
	.parse(process.argv);

conkieStats.setPollFreq(program.refresh);

// -m, --module [mods,...] {{{
if (program.module) {
	program.module = _.flatten(program.module.map(function(m) { return m.split(/\s*,\s*/) }));
	conkieStats.register(program.module);
} else {
	conkieStats.register('*');
}
// }}}

// -s, --settings [object] {{{
if (program.settings) {
	try {
		var options = JSON.parse(program.settings);
		conkieStats.settings(options);
	} catch (e) {
		console.log('Unable to parse: ' + e.toString());
		process.exit(1);
	}
}
// }}}
