// Blaze View
// adds mixin hooks for before and after initialize
Blaze.View = Backbone.View.extend({
	// these should not be used except in mixins
	mixinBeforeInitialize:function() {},
	mixinAfterInitialize:function() {},
	mixinBeforeRemove:function() {},
	mixinBeforeRender:function() {},

	// call this in your ender method if you use any mixins that have have after render hooks such as transitionable
	mixinAfterRender:function(queue) {  return queue; },
	constructor:function(options) {
		this.mixinBeforeInitialize(options);
		Backbone.View.apply(this, arguments);
		this.mixinAfterInitialize(options);
	},
	beforeRemove:function() {},
	// allows for a async remove
	// so you can run transitions or other things
	remove:function() {
		var self = this,
			promises = [];

		this.beforeRemove(promises);
		this.mixinBeforeRemove(promises);

		return Q.all(promises).then(function() {
			Backbone.View.prototype.remove.apply(self, arguments);
		});
	},
	// extend to do model processing before templating
	// never pass a raw model to Blaze.templates since we add all the helpers on to the data object
	getTemplateData:function(adaptorId) {
		// if we do not have a model just return a empty object
		var m = {};
		if(this.model) {
			m = Blaze.Adaptors.convert(adaptorId, this.model, this);
		}
		// if we have a config object add it onto the model json
		if(this.config) {
			m.config = this.config;
		}
		return m;
	},
	// get current target from event
	getTarget:function(evt) {
		return $(evt.currentTarget);
	},
	getTargetData:function(evt, attr) {
		return this.getTarget(evt).data(attr);
	},
	getTargetId:function(evt) {
		return this.getTarget(evt).attr('id');
	},

	// a way to keep track of args
	// note that templates may require args that are just pass through
	args:{},
	getArg:function(name) {
		return this.model.get(this.args[name] || name);
	}
});
Blaze.Mixer.makeMixable(Blaze.View);
Blaze.View.extend = Blaze._extend;
