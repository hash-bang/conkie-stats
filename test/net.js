var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / Net', function() {
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
			.register('net');
	});

	it('should register a Net handler', function() {
		expect(mods).to.contain('net');
	});

	it('should provide a Net object', function() {
		expect(stats).to.have.property('net');
	});

	it('should provide a list of adapters', function() {
		stats.net.forEach(function(adapter) {
			expect(adapter).to.have.property('interface');
		});
	});
});
