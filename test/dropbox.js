var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / Dropbox', function() {
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
			.register('dropbox');
	});

	it('should register a Dropbox handler', function() {
		expect(mods).to.contain('dropbox');
	});

	it('should provide a Dropbox object', function() {
		expect(stats).to.have.property('dropbox');
	});

	it('should provide basic Dropbox info', function() {
		expect(stats.dropbox).to.be.a.string;
	});
});
