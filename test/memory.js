var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / Memory', function() {
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
			.register('memory');
	});

	it('should register a Memory handler', function() {
		expect(mods).to.contain('memory');
	});

	it('should provide a Memory object', function() {
		expect(stats).to.have.property('memory');
	});

	it('should provide basic memory info', function() {
		expect(stats.memory).to.have.property('free');
		expect(stats.memory.free).to.be.a.number;

		expect(stats.memory).to.have.property('total');
		expect(stats.memory.total).to.be.a.number;

		expect(stats.memory).to.have.property('used');
		expect(stats.memory.used).to.be.a.number;
	});
});
