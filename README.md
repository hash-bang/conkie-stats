Conkie-Stats
============
Cross-platform system-statistics (data gatherer for the [Conkie](https://github.com/hash-bang/Conkie) project).

This module is designed to provide continiously updating system information - ideally in a cross-platform compatible way.


	var conkieStats = require('conkie-stats');
	conkieStats
		.register([
			'cpu',
			'dropbox',
			'io',
			'memory',
			'net',
			'system',
			'temperature',
			'topCPU',
			'topMemory',
		])
		.on('error', function(err) {
			console.log('ERROR', err);
		})
		.on('debug', function(msg) {
			console.log('DEBUG', msg);
		})
		.on('update', function(stats) {
			console.log(stats);
		});


Conkie-Stats is actually made up of a few chosen sub-modues. Ideally each sub-module should be cross-platform (hard), sane (harder) and reliable (hardest still).

If you have any recommendations for either code commits or NPM modules please please submit a PR or [GitHub Issue](https://github.com/hash-bang/Conkie-Stats/issues).


Plugins
=======
Conkie-Stats will automatically load all local or global NPM modules named `conkie-stats-*`. A simple NPM install should make these accessible to the main Conkie-Stats library.

See the [NPMJS.com search](https://www.npmjs.com/search?q=conkie-stats) for more Conkie-Stats plugins.


CLI
===
Conkie-Stats also ships with a (very very very) basic Stats outputter which can be accessed with:

	conkie-stats --help

At present this doesn't realy do much expect spew the collected stats object to the screen in a loop every second.


Cross-platform development
==========================
Conkie-Stats relies on a few external components to gather system statistics:

* `bwm-ng` - Network bandwidth monitoring
* `df` - Disk usage info (part of GNU coreutils)
* `ifconfig` / `iwconfig` - Base network interface libraries (part of net-tools)
* `iotop` - Disk usage statistics
* `lm-sensors` - The `sensors` binary provides information about various system temperatures

If you know a way to provide cross-platform support for these modules please either get in touch or submit a pull-request.


Installation
------------

**Linux based systems:**

(ifconfig + df should already be installed)

	sudo apt-get install bwm-ng lm-sensors iotop



Provided data
=============

`cpu`
-----
Various CPU related information.

* `cpu.usage` - Integer representing the CPU usage
* `cpu.load` - A three part array listing the 1, 5 and 15 minute load readings as floats


`disks`
-------
A collection (array of objects) of all active mounted disks within the system.

The result should resemble the following:

```
	[
		{
			filesystem: '/dev/sdb7',
			type: 'ext4',
			blocks: '63384396',
			used: '35256768',
			free: '24891532',
			mount: '/',
		},
	]
```


`files`
-------
Monitor file contents and return them as an array.

This module is not auto-loaded (e.g. via `register('*')`) and needs manual settings to operate.

Specify each file return value as the key and the file path as the value of the `files` settings object:

	conkieStats.settings({
		files: {
			wagesPerHour: '/home/joerandom/wages',
			widgetsPerFoobar: '/tmp/foobar',
		},
	});

Assuming those files exist this should create the structure as the output stats:

	{
		files: {
			wagesPerHour: [100],
			widgetsPerFoobar: [
				'foo',
				'bar',
				'baz',
			],
		},
	}

**NOTES**

* Any error returned by node is accepted as the file contents as a single string. Its up to you to type check this. The module will *not* fail when a file does not exist.
* Files are read as UTF8
* Empty lines at the end of the file are automatically truncated


`io`
-----
The IO object is made up of several values:

* `io.totalRead` - The system-wide disk read I/O value in Kbs
* `io.totalWrite` - The system-wide disk write I/O value in Kbs


`memory`
--------
Various Memory related information.

* `memory.free` - The amount of free system RAM as a long unformatted integer
* `memory.used` - The amount of used system RAM as a long unformatted integer
* `memory.total` - The total amount of system RAM as a long unformatted integer


`power`
-------
A collection (array of objects) of all active power sub-systems. These usually correspond to batteries.

The result should resemble the following:

```
	[
		{
			charge: 2628000
			chargeFull: 4412000,
			device: 'BAT0',
			manufacturer: 'MSI',
			percent: 59,
			model: 'BIF0_9',
			status: 'charging', // charging, discharging
			voltage: 10934000,
			remainingTime: 3809.2470277410835, // Remaining time in seconds
		},
	]
```

NOTE: As well as the above the key `dischargeAt` may also be provided. This is the last known JS date object at which the system had power and *usually* corresponds to the point where the device left the powered state. Since the operating system _does not_ track this information the discharge time is calculated by this module itself and may not correspond to the actual state change timestamp if the module is started *after* the power state change.



`net`
-----
A collection (array of objects) of all active network connections.

Most network interfaces are populated via `ipconfig` but wireless devices have their information merged with `iwconfig`.

If `bwm-ng` is installed the `downSpeed` / `upSpeed` properties are also provided.

##Settings##

| Option                | Type      | Default      | Description |
| ----------------------|-----------|--------------|-------------|
| net.bwmNg             | Boolean   | `true`       | Use `bwm-ng` to gather bandwidth stats. If the binary cannot be found when the module is registered this is automatically disabled |
| net.ignoreNoBandwidth | Boolean   | `false`      | Remove all network devices that dont have any download or upload - not recommended as it tends to remove devices during a quiet period |
| net.ignoreNoIP        | Boolean   | `false`      | Remove all network devices that currently have no IP address |
| net.ignoreDevice      | Array     | `[]`         | Ignore all devices by device name (e.g. `lo` to ignore loopback adapater on Linux)


The result should resemble the following:

```
	[
		{
			type: 'ethernet',
			interface: 'lo',
			link: 'local',
			ipv6_address: '::1/128',
			ipv4_address: '127.0.0.1',
			ipv4_subnet_mask: '255.0.0.0',
			up: true,
			running: true,
			loopback: true,
			downSpeed: 0,
			upSpeed: 0,
		},
		{
			type: 'wireless',
			interface: 'wlp3s0',
			link: 'ethernet',
			address: '66:66:66:66:66:66',
			ipv6_address: '6666::6666:6666:6666:6666/64',
			ipv4_address: '192.168.1.1',
			ipv4_broadcast: '192.168.1.255',
			ipv4_subnet_mask: '255.255.255.0',
			up: true,
			broadcast: true,
			running: true,
			multicast: true,
			access_point: '66:66:66:66:66:67',
			frequency: 2.462,
			ieee: '802.11abgn',
			mode: 'managed',
			quality: 70,
			ssid: 'My WiFi point',
			downSpeed: 0,
			upSpeed: 0,
		}
	]
```


`system`
--------
The system object is made up of several values:

* `system.arch` - The system architecture
* `system.hostname` - The hostname of the system e.g. `MyLaptop` / `localhost`
* `system.uptime` - The system uptime in seconds
* `system.platform` - Node compatible short platform name


`temperature`
-------------
The temperature object is made up of several values:

* `temperature.main` - Main system temperature
* `temperature.cores` - Array of temperatures for each core


`topCPU`
--------
Collection of Top CPU using processes.

* `topCPU.*.pid` - The PID of the process
* `topCPU.*.user` - The user owner of the process
* `topCPU.*.priority` - The scheduling priority of the process
* `topCPU.*.nice` - The nice value of the process
* `topCPU.*.mode` - The mode of the process (D = uninteruptable sleep, R = Running, S = Sleeping, T = Traced / Debugging, Z = Zombie)
* `topCPU.*.cpuPercent` - The currently used CPU percentage of the process
* `topCPU.*.ramPercent` - The currently used RAM percentage of the process
* `topCPU.*.cpuTime` - The currently consumed CPU time of the process
* `topCPU.*.name` - The name of the process


`topIO`
-------
Collection of Top I/O using processes.

* `topIo` - An array of ranked top Disk I/O processes. See below for each provided object attribute.
* `topIo.*.pid` - The PID of a single process
* `topIo.*.ioRead` - The disk read in killobytes
* `topIo.*.ioRead` - The disk write in killobytes
* `topIo.*.name` - The full name of the process


`topMemory`
-----------
Collection of Top Memory using processes.

See the output of [topCPU](#topcpu) for a description of each field.


API
===

The main module exposes the following chainable methods:

* `register(module...)` - Request a module (corresponds to a filename within the `modules/` directory). Some modules require external binaries and will raise errors if this is not satisfied. Arguments can be passed as strings or an array of strings.
* `setPollFreq(timeout)` - Set the polling frequency for modules that poll (in milliseconds)
* `settings(settingsObject)` - Set the Conkie-Stats settings object
* `update(data)` - Merge the main system payload with the provided data. This is a standard object merge however arrays are taken as mutable objects (i.e. a new array value completely overrides the previous one).
* `poll()` - Force a poll of all modules. This is really only intended as an internal function.


Events
------
The following events are raised by the main module:

* `debug(err)` - General debugging mesages. This is like error but usually a fail-soft situation (e.g. module can't provide certain information because of a missing binary - it can still do its job but it should complain to someone)
* `error(err)` - General error handling event
* `moduleRegister(moduleObject)` - A module has been registered
* `update(stats)` - Event emitted when all module polls have completed
* `updatePartial(stats)` - Event emitted on each modules update events. Data is unlikely to be complete at this point until `update`


Module API
----------
Each module is expected to be composed of the following properties:

* `module.name` - String identifying the module - automatically appended by the parent process
* `module.register(finish, parentObject)` - Optional registration callback. If called with no arguments or with `register('*')` all non-debugging modules will be loaded - this can cause issues if your setup is missing any of the external dependencies
* `module.unregister(finish, parentObject)` - Optional de-registration callback
* `module.poll(finish, parentObject)` - Optional polling callback - will be invoked by default every 1000ms and can return data as the callback payload. Any payload will automatically be run via `update(data)`
* `module.settings` - Object containing the modules settings
