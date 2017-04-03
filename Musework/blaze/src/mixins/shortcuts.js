Blaze.Mixer.add('shortcuts', {
	mixinAfterInitialize:function() {
		this._kid = _.uniqueId('kid');

		if(this.shortcuts) {
			this.delegateShortcuts(n);
		}
	},
	addShortcut:function(evt, func) {
		if (_.isString(evt) && _.isFunction(func)) {
			this._hasShortcuts = true;
			Blaze.utils.keybind(this._kid, evt, _.bind(func, this));
		}
	},
	delegateShortcuts:function(events) {
		var self = this, f;
		if(_.isObject(events)) {
            _.each(events, function(name, evt) {
				self.addShortcut(evt, self[name]);
            });
        }
	},
	// you may have to call this
	// if not on a view class
	mixinBeforeRemove:function() {
		this.removeShortcuts();
	},
	removeShortcuts:function() {
		Blaze.utils.keyunbind(this._kid);
		this._hasShortcuts = false;
	},
	hasShortcuts:function() {
		return (this._hasShortcuts);
	}
});