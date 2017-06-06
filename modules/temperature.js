var childProcess = require('child_process');
var which = require('which');

module.exports = {
	poll: function(finish) {
		var mainTemp;
		var coreTemps = [];

		var tempRe = /\+([^°]*)/g;
		childProcess.exec('sensors', (err, stdout, stderr) => {
			if (err) return next();
			stdout.toString().split('\n').forEach(line => {
				var temps = line.match(tempRe);
				if (line.split(':')[0].toUpperCase().indexOf('PHYSICAL') != -1) mainTemp = parseFloat(temps);
				if (line.split(':')[0].toUpperCase().indexOf('CORE ') != -1) {
					coreTemps.push(parseFloat(temps));
				}
			});

			finish(null, {
				temperature: {
					main: mainTemp,
					cores: coreTemps,
				},
			});
		});
	},
	register: function(finish) {
		which('sensors', (err, path) => {
			if (err) return finish('Needed stats binary `sensors` is not in PATH. Either install it or disable the `temperatures` module');
			finish();
		});
	},
};
