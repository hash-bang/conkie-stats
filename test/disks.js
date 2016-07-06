var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / Disks', function() {
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
			.register('disks');
	});

	it('should register a Disk handler', function() {
		expect(mods).to.contain('disks');
	});

	it('should provide a Disk object', function() {
		expect(stats).to.have.property('disks');
	});

	it('should provide disk info', function() {
		expect(stats).to.have.property('disks');
		expect(stats.disks).to.be.an.array;

		stats.disks.forEach(function(mount) {
			expect(mount.filesystem).to.be.a.string;
			expect(mount.type).to.be.a.string;
			expect(mount.blocks).to.be.a.number;
			expect(mount.used).to.be.a.number;
			expect(mount.free).to.be.a.number;
			expect(mount.mount).to.be.a.string;
		});
	});
});
