Conkie-Stats
============
Cross-platform system-statistics (data gatherer for the [Conkie](https://github.com/hash-bang/Conkie) project).


API
===
The main module exposes the following methods:

* `register(module...)` - Request a module (corresponds to a filename within the `modules/` directory). Some modules require external binaries and will raise errors if this is not satisfied. Arguments can be passed as strings or an array of strings.
* `update(data)` - Merge the main system payload with the provided data. This is a standard object merge however arrays are taken as mutable objects (i.e. a new array value completely overrides the previous one).
* `performPoll()` - Force a poll of all modules. This is really only intended as an internal function.


Events
------
The following events are raised by the main module:

* `debug(err)` - General debugging mesages. This is like error but usually a fail-soft situation (e.g. module can't provide certain information because of a missing binary - it can still do its job but it should complain to someone)
* `error(err)` - General error handling event
* `moduleRegister(moduleObject)` - A module has been registered
* `update(stats)` - Event emitted when all module polls have completed
* `updatePartial(stats)` - Event emitted on each modules update events. Data is unlikely to be complete at this point until `update`


Module API
==========
Each module is expected to be composed of the following properties:

* `module.name` - String identifying the module - automatically appended by the parent process
* `module.register(finish, parentObject)` - Optional registration callback
* `module.unregister(finish, parentObject)` - Optional de-registration callback
* `module.poll(finish, parentObject)` - Optional polling callback - will be invoked by default every 1000ms and can return data as the callback payload. Any payload will automatically be run via `update(data)`
* `module.settings` - Object containing the modules settings
