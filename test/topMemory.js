var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / TopMemory', function() {
	var mods = [];
	var stats = {};

	before(function(done) {
		conkieStats
			.on('moduleRegister', function(module) {
				mods.push(module.name);
			})
			.on('update', function(rawStats) {
				stats = rawStats;
			})
			.once('ready', done)
			.register('topMemory');
	});

	it('should register a TopMemory handler', function() {
		expect(mods).to.contain('topMemory');
	});

	it('should provide a TopMemory collection', function() {
		expect(stats).to.have.property('topMemory');
		expect(stats.topMemory).to.be.a.array;
	});
});
