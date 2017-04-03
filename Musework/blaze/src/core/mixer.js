/**
 *
 */

Blaze.Mixer = {
	_mixins:{},
	add:function(id, obj) {
		var err;
		if(!id || !_.isString(id) || !_.isObject(obj)) { err = "Mixer.add requires a id and a object definition";}
		if(this.has(id)) { err = "Mixer.add duplicate mixin "+id+" will not be added"; }
		if(err) { throw err; }
		this._mixins[id] = obj;
	},
	has:function(id) {
		return _.has(this._mixins, id);
	},
	get:function(id) {
		return this._mixins[id];
	},
	mix:function(obj, mixins) {
		if(_.isString(mixins)) {
			this._applyMixin(obj, mixins);
		}
		if(_.isArray(mixins)) {
			_.each(mixins, function(id) {
				this._applyMixin(obj, id);
			}, this);
		}
	},
	_applyMixin:function(obj, id) {
		if(!this.has(id)) {
			throw "cannot mixin "+id+" not found";
		}
		var m = this.get(id);
		if(_.isFunction(obj))  {
			Cocktail.mixin(obj, m);
		}else{
			_.extend(obj, m);
		}
	},
	makeMixable:function(cls) {
		var obj = _.isFunction(cls) ? cls.prototype : cls;
		return _.extend(obj, Blaze.Mixer.Mixable);
	}
};

// this should be added to all classes that are mixable
Blaze.Mixer.Mixable = {
	isMixed:true,
	hasMixin:function(ids) {
		if(!this.mixins || !_.isArray(this.mixins)) {
			return false;
		}
		if(_.isString(ids)) {
			return _.contains(this.mixins, ids);
		}
		if(_.isArray(ids)) {
			return _.intersection(this.mixins, ids).length == ids.length;
		}
		return false;
	}
};
