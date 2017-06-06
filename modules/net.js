var _ = require('lodash');
var async = require('async-chainable');
var bwmNg = require('bwm-ng');
var wirelessTools = require('wireless-tools');
var which = require('which');

var bandwidthUsage = {}; // Holder for polled bandwidth info

module.exports = {
	settings: {
		net: {
			bwmNg: true, // Whether binary `bwm-ng` is available
			iwconfig: true, // Whether binary `iwconfig` is available
			detectTunnels: true, // Add `tunneled: 'possible'` to all interfaces if we find a tunnel device
			ignoreNoIP: false,
			ignoreNoBandwidth: false,
			ignoreDevice: [],
		},
	},
	poll: function(finish) {
		async()
			.set('settings', this.settings)
			.set('bandwidthUsage', {})
			.parallel({
				adapters: function(next) {
					wirelessTools.ifconfig.status(next);
				},
				iwconfig: function(next) {
					if (!_.get(this.settings, 'net.iwconfig')) return next();
					wirelessTools.iwconfig.status(next);
				},
				bandwidth: function(next) {
					if (!_.get(this.settings, 'net.bwmNg')) return next();
					var self = this;
					var nextOnce = _.once(next);
					bwmNg.check((iface, bytesDown, bytesUp) => {
						bandwidthUsage[iface] = {
							downSpeed: bytesDown * 100,
							upSpeed: bytesUp * 100,
						};
						nextOnce();
					});
				},
			})
			.forEach('adapters', function(next, adapter) {
				// Merge .net + Wlan adapter info {{{
				if (_.get(this.settings, 'net.iwconfig')) {
					var wlan = _.find(this.iwconfig, {interface: adapter.interface });
					if (wlan) { // Matching wlan adapter
						adapter.type = 'wireless';
						_.merge(adapter, wlan);
					} else { // Boring ethernet
						adapter.type = 'ethernet';
					}
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
			.then('adapters', function(next) {
				var self = this;
				// Filter out adapters based on `ignore*` criteria {{{
				if (_.get(self.settings, 'net.ignoreNoIP'))
					this.adapters = this.adapters.filter(adapter => {
						return (adapter.ipv4_address || adapter.ipv6_address);
					});

				if (_.get(self.settings, 'net.ignoreNoBandwidth'))
					this.adapters = this.adapters.filter(adapter => {
						return (adapter.downSpeed || adapter.upSpeed);
					});

				if (_.get(self.settings, 'net.ignoreDevice'))
					this.adapters = this.adapters.filter(adapter => {
						return (!_.includes(self.settings.net.ignoreDevice, adapter.interface));
					});

				if (_.get(self.settings, 'net.detectTunnels')) {
					var hasTunnel = this.adapters.some(a => /^tun/.test(a.interface));
					this.adapters.forEach(adapter => adapter.tunneled = hasTunnel ? 'possible' : false);
				}

				next(null, this.adapters);
				// }}}
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
		async()
			.parallel([
				function(next) {
					which('ifconfig', (err, binPath) => {
						if (err) return next('Binary `ifconfig` is not in path'); // If no binary - fail everything
						next();
					});
				},
				function(next) {
					which('iwconfig', (err, binPath) => {
						if (err) { // If no binary - disable iwconfig polling
							parentStats.emit('debug', 'Binary `iwconfig` is not in path - disabling wireless statistics');
							_.set(settings, 'net.iwconfig', false);
						}
						next();
					});
				},
				function(next) {
					which('bwm-ng', (err, binPath) => {
						if (err) { // If no binary - disable BWM-NG polling
							parentStats.emit('debug', 'Binary `bwm-ng` is not in path - disabling bandwith statistics');
							_.set(settings, 'net.bwmNg', false);
						}
						next();
					});
				},
			])
			.end(finish);
	},
};
