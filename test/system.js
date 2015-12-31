var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / System', function() {
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
			.register('system');

		done();
	});

	it('should register a System handler', function() {
		expect(mods).to.contain('system');
	});

	it('should provide a System object', function() {
		expect(stats).to.have.property('system');
	});

	it('should provide basic system info', function() {
		expect(stats.system).to.have.property('arch');
		expect(stats.system.arch).to.be.a.string;

		expect(stats.system).to.have.property('hostname');
		expect(stats.system.hostname).to.be.a.string;

		expect(stats.system).to.have.property('platform');
		expect(stats.system.platform).to.be.a.string;
	});
});
