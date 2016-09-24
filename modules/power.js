var _ = require('lodash');
var async = require('async-chainable');
var fs = require('fs');
var os = require('os');

/**
* Storage for device states (key is device name)
*
* Possible keys:
* 	- status - last logged status of the device
* 	- dischargeAt - last known point the device entered the discharge state
*
* @var {Object}
*/
var deviceStates = {};

module.exports = {
	poll: function(finish) {
		if (os.platform() != 'linux') return finish('Platform is unsupported');

		async()
			// Find all power devices {{{
			.then('devices', function(next) {
				fs.readdir('/sys/class/power_supply', function(err, files) {
					if (err) return next(err);
					return next(null, 
						files.filter(function(name) {
							return /^BAT/.test(name);
						})
					);
				});
			})
			// }}}
			// For Each device... {{{
			.forEach('devices', function(next, dev, index) {
				var self = this;
				async()
					// Read in power profile data in parallel {{{
					.parallel({
						charge: function(next) {
							fs.readFile('/sys/class/power_supply/' + dev + '/charge_now', 'utf8', next);
						},
						chargeFull: function(next) {
							fs.readFile('/sys/class/power_supply/' + dev + '/charge_full', 'utf8', next);
						},
						current: function(next) {
							fs.readFile('/sys/class/power_supply/' + dev + '/current_now', 'utf8', next);
						},
						manufacturer: function(next) {
							fs.readFile('/sys/class/power_supply/' + dev + '/manufacturer', 'utf8', next);
						},
						model: function(next) {
							fs.readFile('/sys/class/power_supply/' + dev + '/model_name', 'utf8', next);
						},
						status: function(next) {
							// Clean up status now as its used by later tasks
							fs.readFile('/sys/class/power_supply/' + dev + '/status', 'utf8', function(err, res) {
								if (err) return next(err);
								next(null, _.trimEnd(res).toLowerCase());
							});
						},
						voltage: function(next) {
							fs.readFile('/sys/class/power_supply/' + dev + '/voltage_now', 'utf8', next);
						},
					})
					// }}}
					// Store / set last device state (so we can calcuate how long we've been on battery {{{
					.then(function(next) {
						if (!deviceStates[dev]) deviceStates[dev] = {status: this.status};

						if (this.status == 'discharging') {
							if (!deviceStates[dev].dischargeAt) { // Is discharging and we dont know since when
								deviceStates[dev].dischargeAt = new Date();
							}
						} else if (_.has(deviceStates[dev], 'dischargeAt')) { // Not discharging but key exists - delete it
							delete deviceStates[dev].dischargeAt;
						}

						next();
					})
					// }}}
					// End - compile all stats and return {{{
					.end(function(err) {
						if (err) return next(err);
						self.devices[index] = {
							charge: parseInt(_.trimEnd(this.charge)),
							chargeFull: parseInt(_.trimEnd(this.chargeFull)),
							current: parseInt(_.trimEnd(this.current)),
							device: dev,
							manufacturer: _.trimEnd(this.manufacturer),
							model: _.trimEnd(this.model),
							status: this.status,
							voltage: parseInt(_.trimEnd(this.voltage)),
						};

						// Post data calculations
						self.devices[index].percent = _.round(self.devices[index].charge / self.devices[index].chargeFull * 100);
						self.devices[index].remainingTime = self.devices[index].charge / self.devices[index].current * 60 * 60;
						self.devices[index].remainingChargingTime = (self.devices[index].chargeFull - self.devices[index].charge) / self.devices[index].current * 60 * 60;
						self.devices[index].watts = _.round((self.devices[index].current * self.devices[index].voltage) / 1000000000000, 1);

						// Post state calculations
						if (deviceStates[dev].dischargeAt) self.devices[index].dischargeAt = deviceStates[dev].dischargeAt;

						next();
					});
					// }}}
			})
			// }}}
			// End {{{
			.end(function(err) {
				if (err) return finish(err);
				finish(null, {
					power: this.devices
				});
			});
			// }}}
	},
	register: function(finish) {
		if (os.platform() != 'linux') return finish('Currently power information is only available for the Linux platform. Please disable the `power` module');
		finish();
	},
};
