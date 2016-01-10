var _ = require('lodash');
var async = require('async-chainable');
var fs = require('fs');
var os = require('os');

module.exports = {
	poll: function(finish) {
		if (os.platform() == 'linux') {
			async()
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
				.forEach('devices', function(next, dev, index) {
					var self = this;
					async()
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
								fs.readFile('/sys/class/power_supply/' + dev + '/status', 'utf8', next);
							},
							voltage: function(next) {
								fs.readFile('/sys/class/power_supply/' + dev + '/voltage_now', 'utf8', next);
							},
						})
						.end(function(err) {
							if (err) return next(err);
							self.devices[index] = {
								charge: parseInt(_.trimRight(this.charge)),
								chargeFull: parseInt(_.trimRight(this.chargeFull)),
								current: parseInt(_.trimRight(this.current)),
								device: dev,
								manufacturer: _.trimRight(this.manufacturer),
								model: _.trimRight(this.model),
								status: _.trimRight(this.status).toLowerCase(),
								voltage: parseInt(_.trimRight(this.voltage)),
							};
							// Post data calculations
							self.devices[index].percent = _.round(self.devices[index].charge / self.devices[index].chargeFull * 100);
							self.devices[index].remainingTime = self.devices[index].charge / self.devices[index].current * 60 * 60;
							self.devices[index].remainingChargingTime = (self.devices[index].chargeFull - self.devices[index].charge) / self.devices[index].current * 60 * 60;
							next();
						});
				})
				.end(function(err) {
					if (err) return finish(err);
					finish(null, {
						power: this.devices
					});
				});
		} else {
			finish('Platform is unsupported');
		}
	},
	register: function(finish) {
		if (os.platform() != 'linux') return finish('Currently power information is only available for the Linux platform. Please disable the `power` module');
		finish();
	},
};
