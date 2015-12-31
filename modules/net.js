var _ = require('lodash');
var async = require('async-chainable');
var bwmNg = require('bwm-ng');
var wirelessTools = require('wireless-tools');
var which = require('which');

var bandwidthUsage = {}; // Holder for polled bandwidth info

module.exports = {
	settings: {
		bwmNg: true,
	},
	poll: function(finish) {
		async()
			.set('bandwidthUsage', {})
			.parallel({
				adapters: function(next) {
					wirelessTools.ifconfig.status(next);
				},
				iwconfig: function(next) {
					wirelessTools.iwconfig.status(next);
				},
				bandwidth: function(next) {
					var self = this;
					bwmNg.check(function(iface, bytesDown, bytesUp) {
						bandwidthUsage[iface] = {
							downSpeed: bytesDown,
							upSpeed: bytesUp,
						};
					});
					next();
				},
			})
			.forEach('adapters', function(next, adapter) {
				// Merge .net + Wlan adapter info {{{
				var wlan = _.find(this.iwconfig, {interface: adapter.interface });
				if (wlan) { // Matching wlan adapter
					adapter.type = 'wireless';
					_.merge(adapter, wlan);
				} else { // Boring ethernet
					adapter.type = 'ethernet';
				}
				// }}}
				// Match against ifSpeeds to provide bandwidth speeds {{{
				if (bandwidthUsage[adapter.interface]) {
					adapter.downSpeed = bandwidthUsage[adapter.interface].downSpeed;
					adapter.upSpeed = bandwidthUsage[adapter.interface].upSpeed;
				}
				// }}}
				next();
			})
			.end(function(err) {
				if (err) return finish(err);
				finish(null, {
					net: this.adapters,
				});
			});
	},
	register: function(finish, parentStats) {
		var settings = this.settings;
		which('bwm-ng', function(err, binPath) {
			if (err) { // If no binary - disable BWM-NG polling
				parentStats.emit('debug', 'Binary `bwm-ng` is not in path - disabling bandwith statistics');
				settings.bwmNg = false;
			}
			finish();
		});
	},
};
