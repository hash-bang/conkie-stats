var _ = require('lodash');
var async = require('async-chainable');
var events = require('events');
var util = require('util');

function ConkieStats() {
	var self = this;
	var mods = [];
	var payload = {};

	// FIXME: unregister

	this.register = function() {
		_.flatten(Array.prototype.slice.call(arguments))
			.forEach(function(modName) {
				try {
					var mod = require(__dirname + '/modules/' + modName);
					mod.name = modName;
					mods.push(mod);
					mod.register(function() { }, self);
					self.emit('moduleRegister', mod);
				} catch (e) {
					self.emit('error', 'Error registering module "' + mod + '" - ' + e.toString());
				}
			});
		setTimeout(this.performPoll, null);
		return this;
	};

	this.update = function(data) {
		self.emit('updatePartial', data);
		_.merge(payload, data);
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
