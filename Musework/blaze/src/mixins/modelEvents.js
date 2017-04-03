// requires hashbinder and a model
Blaze.Mixer.add('modelEvents', {
	mixinAfterInitialize:function(options) {
		var me = options && options.modelEvents ?  options.modelEvents : this.modelEvents;
		if(me) {
			this.delegateModel(me);
		}
	},
	delegateModel:function(hash) {
		// allow for a function -> object or an object
		if(_.isFunction(hash)) {
			hash = hash();
		}
		if(_.isObject(hash)) {
			this.hashbind(this.model, hash);
		}
	},
	undelegateModel:function() {
		this.stopListening(this.model);
	},
	mixinBeforeRemove:function() {
		this.undelegateModel();
	}
});