// a super simple knockout.js style attribute binding
// this is to allow simple binding from the template
// use full for updating pass through args
//
Blaze.Mixer.add('htmlBinder', {
	// make sure to pass through promise queue
	mixinAfterRender:function(queue) {
		this.applyBindings();
		return queue;
	},
	applyBindings:function() {
		// get all elements that require binding
		var elms = this.$('[data-bind]');

		_.each(elms, function(elm) {
			// get bindable elements
			var el = $(elm),
				attr = el.data('bind'),
				evt = 'change:'+attr;

			// no need to clean this up since stopListening is called on beforeRemove
			this.listenTo(this.model, evt, function(m, v) {
				el.html(v);
			});
		}, this);
	}
});