// requires hasbind binder and a collection
Blaze.Mixer.add('collectionEvents', {
	mixinAfterInitialize:function(options) {
		var me = options && options.collectionEvents ?  options.collectionEvents : this.collectionEvents;
		if(me) {
			this.delegateCollection(me);
		}
	},
	delegateCollection:function(hash) {
		// allow for a function -> object or an object
		if(_.isFunction(hash)) {
			hash = hash();
		}
		if(_.isObject(hash)) {
			this.hashbind(this.collection, hash);
		}
	},
	undelegateCollection:function() {
		this.stopListening(this.collection);
	}
});