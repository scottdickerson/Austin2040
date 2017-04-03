// application extends from Backbone.Router
Blaze.Application = Backbone.Router.extend({
	// overwrite the constructor so that initialize is still available
	constructor:function(options) {
		if(!options) { options = {}; }

		// store app on the Blaze Name Space. use App name if you need multiple apps
		Blaze[(options.appName || "app")] = this;

		this.mixinBeforeInitialize(options);
		Backbone.Router.apply(this, arguments);
		this.mixinAfterInitialize(options);
	},
	// these should not be used except in mixins
	mixinBeforeInitialize:function() {},
	mixinAfterInitialize:function() {},
	setDocumentTitle:function(s) {
		document.title = s;
	}
});

Blaze.Application.extend = Blaze._extend;



