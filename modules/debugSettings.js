var os = require('os');

module.exports = {
	settings: {
		debug: {
			testNumber: 123,
			testString: 'Hello world',
			testBoolean: true,
		},
	},
	poll: function(finish) {
		finish(null, {
			debugSettings: this.settings,
		});
	},
};
