var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / IO', function() {
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
			.register('io');
	});

	it('should register a IO handler', function() {
		expect(mods).to.contain('io');
	});

	it('should provide a IO object', function() {
		expect(stats).to.have.property('io');
	});

	it('should provide basic IO info', function() {
		expect(stats.io).to.have.property('totalRead');
		expect(stats.io.totalRead).to.be.a.number;

		expect(stats.io).to.have.property('totalWrite');
		expect(stats.io.totalWrite).to.be.a.number;
	});

	it('should provide top IO process info', function() {
		expect(stats).to.have.property('topIO');
		expect(stats.topIO).to.be.an.array;
	});
});
