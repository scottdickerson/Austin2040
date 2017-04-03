Blaze.Storage.LocalStorageAdapter = Blaze.Storage.Adaptor.extend({
	initialize:function(options) {
		this.id = options.id || 'Local Storage';
		this.setActions();
		this._isAvailable = (window.store);
	},
	isAvailable:function() {
		return this._isAvailable;
	},
	set:function(name, value) {
		if(!this.isAvailable()) { return false; }
		return store.set(name, value);
	},
	get:function(name) {
		if(!this.isAvailable()) { return false; }
		return store.get(name);
	},
	setActions:function() {
		this.addAction('remove', function(name) {
			if(!this.isAvailable()) { return false; }
			store.remove(name);
		});
		this.addAction('clear', function() {
			if(!this.isAvailable()) { return false; }
			store.clear();
		});
	}
});