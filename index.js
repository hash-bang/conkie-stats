var _ = require('lodash');
var async = require('async-chainable');
var events = require('events');
var util = require('util');

function ConkieStats() {
	var self = this;
	var mods = [];
	var payload = {};
	var _settings = {};

	// FIXME: unregister

	this._settings = _settings;

	this.register = function(finish) {
		async()
			.set('newMods', [])
			.forEach(_.flatten(Array.prototype.slice.call(arguments)), function(next, modName) {
				try {
					var mod = require(__dirname + '/modules/' + modName);
					mod.name = modName;
					mods.push(mod);

					// Merge in mod's settings (if any)
					if (_.isObject(mod.settings)) {
						_.defaults(self._settings, mod.settings);
						mod.settings = self._settings; // Glue mod.settings to the main settings structure
					}

					// FIXME: Finish action currently doesnt wait for response / error
					if (_.isFunction(mod.register)) {
						mod.register(function(err) {
							if (err) return next(err);
							self.emit('moduleRegister', mod);
							next();
						}, self);
					} else {
						self.emit('moduleRegister', mod);
						next();
					}
				} catch (e) {
					next('Error registering module "' + mod + '" - ' + e.toString());
				}
			})
			// Force poll all modules {{{
			.then(function(next) {
				self.performPoll(next);
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
	this.performPoll = function(finish) {
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
				pollHandle = setTimeout(self.performPoll, 1000);
				if (_.isFunction(finish)) finish(err);
			});
	};
};

util.inherits(ConkieStats, events.EventEmitter);

module.exports = new ConkieStats();
