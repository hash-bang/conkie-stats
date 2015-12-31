var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / CPU', function() {
	var mods = [];

	before(function() {
		conkieStats
			.on('moduleRegister', function(module) {
				mods.push(module);
			})
			.register('cpu');
	});

	it('should register a CPU handler', function() {
		expect(mods).to.contain('cpu');
	});
});
