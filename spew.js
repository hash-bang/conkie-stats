#!/usr/bin/env node

/**
* Extremely simple sample app that just spews JSON object data in a loop
*/

var _ = require('lodash');
var colors = require('colors');
var conkieStats = require('./index');
var util = require('util');

conkieStats
	.register('*')
	.settings({
		net: {
			ignoreNoIP: true,
		},
        mpris: {
            player: 'vlc',
        },
	})
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
