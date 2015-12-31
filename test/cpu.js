var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / CPU', function() {
	var mods = [];
	var stats = {};

	before(function(done) {
		this.timeout(5000);

		conkieStats
			.on('moduleRegister', function(module) {
				mods.push(module.name);
			})
			.on('update', function(rawStats) {
				stats = rawStats;
			})
			.register('cpu');

		// Wait 3 seconds so we can gather some stats
		setTimeout(done, 3000);
	});

	it('should register a CPU handler', function() {
		expect(mods).to.contain('cpu');
	});

	it('should provide a CPU object', function() {
		expect(stats).to.have.property('cpu');
	});

	it('should provide a CPU load', function() {
		expect(stats.cpu).to.have.property('load');
		expect(stats.cpu.load).to.be.an.array;
		expect(stats.cpu.load).to.have.length(3);
		stats.cpu.load.forEach(function(l) {
			expect(l).to.be.a.number;
		});
	});
});
