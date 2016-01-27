var _ = require('lodash');
var async = require('async-chainable');
var events = require('events');
var fspath = require('path');
var moduleFinder = require('module-finder');
var util = require('util');

// Modules that should be loaded on register() / register('*')
// Modules installed as NPM modules (anything matching /^conkie-stats-/) will also be assumed
var assumeAll = [
	'cpu',
	'disks',
	'dropbox',
	'io',
	'memory',
	'net',
	'power',
	'system',
	'temperature',
	'topCPU',
	'topMemory',
];

function ConkieStats() {
	var self = this;
	var mods = [];
	var payload = {};
	var _settings = {};
	var _pollFreq = 1000;

	// FIXME: unregister

	this._settings = _settings;

	this.register = function(finish) {
		async()
			.set('mods', _.flatten(Array.prototype.slice.call(arguments)))
			.set('newMods', [])
			.set('failedMods', [])
			.then('npmModules', function(next) {
				moduleFinder({
					local: true,
					global: true,
					cwd: __dirname,
					filter: {
						name: /^conkie-stats-/,
					},
				}).then(function(res) {
					next(null, res);
				}, next);
				// }}}
			})
			.then(function(next) {
				if (
					(!this.mods.length) ||
					(this.mods.length == 1 && this.mods[0] == '*')
				) { // Register all in assumeAll
					this.mods = assumeAll.concat(this.npmModules.map(function(mod) { return mod.pkg.name }));
					return next();
				} else {
					return next();
				}
			})
			.forEach('mods', function(next, modName) {
				try {
					var mod;
					var npmMod = this.npmModules.find(function(mod) { return mod.pkg.name == modName });

					if (npmMod) {
						mod = require(fspath.dirname(npmMod.path));
						mod.name = npmMod.pkg.name.replace(/^conkie-stats-/, '');
					} else { // Load from local FS
						mod = require(__dirname + '/modules/' + modName);
						mod.name = modName;
					}

					// Merge in mod's settings (if any)
					if (_.isObject(mod.settings)) {
						_.defaults(self._settings, mod.settings);
						mod.settings = self._settings; // Glue mod.settings to the main settings structure
					}

					// FIXME: Finish action currently doesnt wait for response / error
					if (_.isFunction(mod.register)) {
						mod.register(function(err) {
							if (err) {
								self.emit('debug', 'Module ' + mod.name + ' failed to load - ' + err.toString());
							} else {
								mods.push(mod);
								self.emit('moduleRegister', mod);
							}
							next();
						}, self);
					} else {
						mods.push(mod);
						self.emit('moduleRegister', mod);
						next();
					}
				} catch (e) {
					next('Error registering module "' + mod + '" - ' + e.toString());
				}
			})
			// Force poll all modules {{{
			.then(function(next) {
				self.poll(next);
			})
			// }}}
			// Emit: ready {{{
			.then(function(next) {
				self.emit('ready');
			})
			// }}}
			.end(function(err) {
				if (err) self.emit('error', err.toString());
				if (_.isFunction(finish)) finish(err);
			});

		return this;
	};

	this.settings = function(options) {
		_.merge(this._settings, options);
		return this;
	};

	this.update = function(data) {
		self.emit('updatePartial', data);
		_.merge(payload, data, function(a, b, c) {
			if (_.isArray(a)) return b; // Arrays are always taken in their entirety
			return undefined;
		});

		return this;
	};

	var pollHandle;
	this.setPollFreq = function(timeout) {
		clearTimeout(pollHandle); // Cancel scheduled polls
		if (!_.isUndefined(timeout)) self._pollFreq = timeout;
		pollHandle = setTimeout(self.poll, self._pollFreq);
		return this;
	};

	this.poll = function(finish) {
		clearTimeout(pollHandle); // Cancel scheduled polls

		async()
			.forEach(mods, function(next, mod) {
				if (!mod.poll) return next();
				mod.poll(function(err, payload) {
					if (err) return next(err);
					if (payload) self.update(payload);
					next();
				});
			})
			.end(function(err) {
				self.emit('update', payload);
				// Reschedule
				pollHandle = setTimeout(self.poll, self._pollFreq);
				if (_.isFunction(finish)) finish(err);
			});

		return this;
	};
};

util.inherits(ConkieStats, events.EventEmitter);

module.exports = new ConkieStats();
