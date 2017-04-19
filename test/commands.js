var conkieStats = require('../index');
var expect = require('chai').expect;

describe('Conkie / Commands', function() {
	var mods = [];
	var output = {};

	before(function(done) {
		conkieStats
			.on('moduleRegister', function(module) {
				mods.push(module.name);
			})
			.on('update', function(rawOutput) {
				output = rawOutput;
			})
			.once('ready', done)
			.register('commands')
			.settings({
				commands: {
					echo: 'echo Hello World',
					ls: 'ls -la',
					uptime: 'uptime',
				},
			})
	});

	it('should register a Commands handler', function() {
		expect(mods).to.contain('commands');
	});

	it('should provide a Commands object', function() {
		expect(output).to.have.property('commands');
	});

	it('should provide basic Commands info', function() {
		expect(output).to.be.an.object;
		expect(output).to.have.property('commands');
		expect(output.commands).to.be.an.object;

		expect(output.commands).to.have.property('echo');
		expect(output.commands.echo).to.equal('Hello World');

		expect(output.commands).to.have.property('ls');
		expect(output.commands.ls).to.be.an.array;
		expect(output.commands.ls).to.have.length.above(1); // Counting '.' + '..' from any directory

		expect(output.commands).to.have.property('uptime');
		expect(output.commands.uptime).to.be.a.string;
		expect(output.commands.uptime).to.match(/ load average: /);
	});
});
