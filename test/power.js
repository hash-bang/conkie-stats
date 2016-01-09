var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / Power', function() {
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
			.register('power');
	});

	it('should register a Power handler', function() {
		expect(mods).to.contain('power');
	});

	it('should provide a Power object', function() {
		expect(stats).to.have.property('power');
		expect(stats.power).to.be.an.array;
	});

	it('should provide power information for each item', function() {
		stats.power.forEach(function(dev) {
			expect(dev.charge).to.be.a.number;
			expect(dev.chargeFull).to.be.a.number;
			expect(dev.current).to.be.a.number;
			expect(dev.device).to.be.a.string;
			expect(dev.manufacturer).to.be.a.string;
			expect(dev.model).to.be.a.string;
			expect(dev.status).to.be.a.string;
			expect(dev.voltage).to.be.a.number;
		});
	});
});
