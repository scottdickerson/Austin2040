Blaze.Storage = {};
//TODO validators for get
//TODO async support, should use promises
Blaze.Storage.Adaptor = function(options) {
	this.suppressErrors = false;
	this.actions = {};
	this.initialize(options || {});
	if(!this.id) {
		this.id = _.uniqueId('storageAdptor_');
	}
	if(this.isAvailable()) {
		Blaze.dispatcher.trigger('storage:ready', this.id, this);
	}

};
_.extend(Blaze.Storage.Adaptor.prototype, {
	// any set up
	initialize:function() {},
	// is not async by default
	isAsync:function() {
		return false;
	},
	// null for any
	gettable:null,
	settable:null,
	// implement you check for the storage method here
	//  will be called before and set or get
	isAvailable:function() {
		return false;
	},
	// this is the api for Blaze Storage
	get:function() { return false; },
	set:function() { return false; },

	// actions are registered so they are exposed for debug panels
	action:function(name, value) {
		if(!this.isAvailable()) {
			return false;
		}
		var a = this.actions[name];
		if(a) {
			return a.call(this, value);
		}else{
			this.logError('has no action'+name);
			return false;
		}
	},
	addAction:function(name, f) {
		if(!_.isFunction(f)) {
			console.error(this.id, 'storage action '+name+' must be a function');
		}
		this.actions[name] = f;
	},
	getActionList:function() {
		return _.keys(this.actions);
	},
	// error hadling
	onError:function() {
		this.logError('unknown error');
	},
	logError:function(msg) {

		if(this.suppressErrors) { return; }
		Blaze.dispatcher.trigger('storage:error', this.id,  msg);
	}
});
Blaze.Storage.Adaptor.extend = Blaze._extend;