var _ = require('lodash');
var async = require('async-chainable');
var events = require('events');
var fs = require('fs');
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
	'feedRSSAtom'
];

function ConkieStats() {
	var self = this;
	var mods = [];
	var payload = {};
	self._pollFreq = 1000;

	// FIXME: unregister

	self._settings = {
		pollFrequency: {},
	};
	self._userSettings = {}; // Holder for user specified settings via .settings() - needed as some modules may load AFTER a .settings() call


	/**
	* Register one or more modules
	* @param {function} finish Callback to run after the stated modules have been registered
	* @param {array|string} [module...] The module or modules to register, this function can be called multiple times. Each item can be a file in ./modules/NAME.js, an NPM module name (installed on the system globally) or a path to a JS file which provides the module definition.
	* @fires debug Debug message fired when loading modules or if the module returns an error
	* @fires moduleRegister Fired when a individual module successfully registers
	* @fires ready Fired when all modules have loaded
	* @fires error Fired when any error occurs
	* @return {Object} This chainable object
	*/
	self.register = function(finish) {
		async()
			.set('mods', _.flatten(Array.prototype.slice.call(arguments)))
			.set('newMods', [])
			.set('failedMods', [])
			.then('npmModules', function(next) {
				moduleFinder({
					local: false, // Only set this to true if you are debugging conkie-stats locally
					global: true,
					cwd: __dirname,
					filter: {
						name: /^conkie-stats-/,
					},
				}).then(res => next(null, res), next);
				// }}}
			})
			.then(function(next) {
				if (
					(!this.mods.length) ||
					(this.mods.length == 1 && this.mods[0] == '*')
				) { // Register all in assumeAll
					this.mods = assumeAll.concat(this.npmModules.map(mod => mod.pkg.name));
					next();
				} else {
					next();
				}
			})
			.then(function(next) {
				self.emit('debug', 'Using modules: ' + this.mods.join(', '));
				next();
			})
			.forEach('mods', function(next, modName) {
				try {
					var mod;
					var npmMod = this.npmModules.find(mod => mod.pkg.name == modName);

					if (npmMod) {
						mod = require(fspath.dirname(npmMod.path));
						mod.name = npmMod.pkg.name.replace(/^conkie-stats-/, '');
					} else if (! _.attempt(fs.accessSync.bind(this, modName))) { // Is the file a resolvable path?
						mod = require(modName);
					} else if (! _.attempt(fs.accessSync.bind(this, __dirname + '/modules/' + modName + '.js'))) { // Load from local FS
						mod = require(__dirname + '/modules/' + modName + '.js');
						mod.name = modName;
					} else {
						return next('Unknown module "' + modName + '" - this is not an NPM, internal module or readable path');
					}


					// Merge in mod's settings (if any)
					if (_.isObject(mod.settings)) {
						_.merge(self._settings, mod.settings);
						mod.settings = self._settings; // Glue mod.settings to the main settings structure
					}

					if (_.isFunction(mod.register)) {
						mod.register(err => {
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
					next('Error registering module "' + (mod || modName) + '" - ' + e.toString());
				}
			})
			// Force poll all modules {{{
			.then(function(next) {
				self.poll(next);
			})
			// }}}
			// Merge user settings in with (probably) new settings structure {{{
			.then(function(next) {
				self.settings();
				next();
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


	/**
	* Set the settings structure
	* Since some modules may load after this has been called we keep two copies of the settings structure (_settings + _userSettings) and remerge after each .register() call
	* @param {Object} options The new settings structure that will be merged
	* @return {Object} This chainable object
	*/
	self.settings = function(options) {
		_.merge(self._userSettings, options || {});
		_.merge(self._settings, self._userSettings);
		return this;
	};


	/**
	* Merge a data structure with the current data payload
	* @param {Object} data The incomming data to merge
	* @fires updatePartial Fired whenever data gets merged
	* @return {Object} This chainable object
	*/
	self.update = function(data) {
		self.emit('updatePartial', data);
		_.mergeWith(payload, data, (a, b, c) => {
			if (_.isArray(a)) return b; // Arrays are always taken in their entirety
			return undefined;
		});

		return this;
	};

	var pollHandle;
	/**
	* Set the overall module poll frequency
	* This can be overriden for individual modules via settings.pollFrequency.MODULE_NAME
	* NOTE: Calling this function also forces a poll refresh
	* @param {number|undefined} timeout The new minimum timeout to use
	* @return {Object} This chainable object
	*/
	self.setPollFreq = function(timeout) {
		clearTimeout(pollHandle); // Cancel scheduled polls
		self._pollFreq = _.isEmpty(timeout) ? 0 : timeout;
		pollHandle = setTimeout(self.poll, self._pollFreq);
		return this;
	};


	/**
	* Trigger a poll event for all modules that require it
	* NOTE: Unless force==true this function will also check settings.pollFrequency.MODNAME to determine if the module is due to be polled
	* @param {function} finish Callback to fire post poll
	* @param {boolean} [force=false] Whether to force the poll (ignore any per-module pollFrequencies)
	* @fires update Fired whenever the data structure gets updated
	* @return {Object} This chainable object
	*/
	self.poll = function(finish, force) {
		clearTimeout(pollHandle); // Cancel scheduled polls

		async()
			.forEach(mods, function(next, mod) {
				if (!mod.poll) return next();

				if (
					!force && // Not being forced
					_.has(self, ['_settings', 'pollFrequency', mod.name]) && // Has a pollFrequency for this module
					mod.lastPoll && // Has a last poll event
					mod.lastPoll + _.get(self, ['_settings', 'pollFrequency', mod.name]) > Date.now() // Not due to update yet
				) return next();

				mod.lastPoll = Date.now(); // Mark that we are polling NOW to prevent new async threads jumping in
				mod.poll((err, payload) => {
					if (err) return next(err);
					if (payload) {
						_.set(payload, ['lastUpdate', mod.name], mod.lastPoll);
						self.update(payload);
					}
					next();
				});
			})
			.end(function(err) {
				// Tell upstream eventEmitter that we've finished
				self.emit('update', payload);

				// Calculate minimum amount of time to sleep {{{
				var frequencies = _.values(self._settings.pollFrequency);
				if (self._pollFreq > 0) frequencies.push(self._pollFreq); // Include the minimum if we have one

				var minTimeout;
				minTimeout = Math.min.apply(this, frequencies);
				if (minTimeout === Infinity) minTimeout = 0; // Infinity actually means we dont have any idea - so refresh on next tick
				// }}}

				pollHandle = setTimeout(self.poll, minTimeout);
				if (_.isFunction(finish)) finish(err);
			});

		return this;
	};
};

util.inherits(ConkieStats, events.EventEmitter);

module.exports = new ConkieStats();
