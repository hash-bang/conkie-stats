var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / Temperature', function() {
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
			.register('temperature');
	});

	it('should register a Temperature handler', function() {
		expect(mods).to.contain('temperature');
	});

	it('should provide a Temperature object', function() {
		expect(stats).to.have.property('temperature');
	});

	it('should provide a system-wide temperature reading', function() {
		expect(stats.temperature).to.have.property('main');
		expect(stats.temperature.main).to.be.a.number;
	});

	it('should provide a core specific temperature reading', function() {
		expect(stats.temperature).to.have.property('cores');

		stats.temperature.cores.forEach(function(reading) {
			expect(reading).to.be.a.number;
		});
	});
});
