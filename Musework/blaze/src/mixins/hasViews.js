// mixin - hasViews
// to manage views
// requires: hashBinder
// usage:
//
//
//
//
Blaze.Mixer.add('hasViews', {
	mixinBeforeInitialize:function() {
		this._views = {};
	},
	mixinAfterInitialize:function() {
		// if this is a view auto call createViews
		if(this.$el) {
			this.createViews();
		}
	},
	// this will be called on intialize once _views has been created
	// this is just here to make sure one is present
	createViews:function() {},
	// container can be string or jquery object
	addView:function(id, view, container, events) {
		this._views[id] = view;
		if(_.isObject(events)) {
			this.hashbind(view, events);
		}
		if(container) {
			if(_.isString(container)) {
				// search global if we do not have a scoped jquery
				((this.$) ? this.$(container) : $(container)).append(view.el);
			}else if(_.isJquery(container)) {
				container.append(view.el);
			}
		}
		return view;
	},
	removeView:function(id) {
		var v = this._views[id];
		v.stopListening();
		v.remove();
		delete this._views[id];
		return this;
	},
	hasView:function(id) {
		return _.has(this._views, id);
	},
	getView:function(id) {
		return this._views[id];
	}
});