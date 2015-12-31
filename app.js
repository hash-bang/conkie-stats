#!/usr/bin/env node

var _ = require('lodash');
var colors = require('colors');
var conkieStats = require('./index');
var util = require('util');

conkieStats
	.register([
		'cpu',
		'dropbox',
		'io',
		'memory',
		'net',
		'system',
		'temperature',
		'topCPU',
	])
	.on('error', function(err) {
		console.log(colors.red('ERROR', err));
	})
	.on('debug', function(err) {
		console.log(colors.grey('DEBUG', err));
	})
	.on('update', function(stats) {
		// Output colorful JSON structure of system information
		console.log(util.inspect(stats, {depth: null, colors: true}));
	});
