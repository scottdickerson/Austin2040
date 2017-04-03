// mixin - globalEvents
// allows binding to the global events dispatcher
// requires: hashbinder
// usage:
//
//
//
//
Blaze.Mixer.add('globalEvents', {
	mixinAfterInitialize:function(options) {
		// set global events on class or or per instance
		var ge = options && options.globalEvents ?  options.globalEvents : this.globalEvents;
		if(ge) {
			this.delegateGlobal(ge);
		}
	},
	delegateGlobal:function(hash) {
		// allow for a function -> object or an object
		if(_.isFunction(hash)) {
			hash = hash();
		}
		if(_.isObject(hash)) {
			this.hashbind(Blaze.dispatcher, hash);
		}
	},
	// set suppressLocalEvents to disable sending a global event through the object itself
	triggerGlobal:function() {
		if(!this.suppressLocalEvents) {
			this.trigger.apply(this, arguments);
		}
		Blaze.dispatcher.trigger.apply(Blaze.dispatcher, arguments);
	}
});