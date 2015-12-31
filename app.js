#!/usr/bin/env node

var _ = require('lodash');
var colors = require('colors');
var conkieStats = require('./index');

conkieStats
	.register([
		'cpu',
		'system',
	])
	.on('update', function(stats) {
		console.log();
		[
			'cpu.load',
			'cpu.usage',
			'system.arch',
			'system.hostname',
			'system.platform',
		]
			.forEach(function(key) {
				console.log(colors.cyan(key), '=', _.get(stats, key));
			});
	});

setTimeout(function() {
	console.log('PULSE TERMINATE!');
}, 10000);
