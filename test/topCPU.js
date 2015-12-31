var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / TopCPU', function() {
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
			.register('topCPU');
	});

	it('should register a TopCPU handler', function() {
		expect(mods).to.contain('topCPU');
	});

	it('should provide a TopCPU collection', function() {
		expect(stats).to.have.property('topCPU');
		expect(stats.topCPU).to.be.a.array;
	});
});
