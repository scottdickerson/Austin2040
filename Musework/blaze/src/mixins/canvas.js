// view mixin for
// TODO: add canvas convenience methods
Blaze.Mixer.add('canvas', {
	mixinBeforeInitialize:function(options) {
		options = options || {};

		// have to do this since tagName is a string and will not be mixed in
		this._makeCanvas();

		this.ctx = this.el.getContext("2d");

		this.setCanvasWidth(this.w || options.w || 100);
		this.setCanvasHeight(this.h || options.h || 100);
	},
	_makeCanvas:function() {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<canvas>').attr(attrs);
        this.setElement($el, false);
	},
	setCanvasWidth:function(n) {
		this.w = n;
		this.el.width = n;
	},
	setCanvasHeight:function(n) {
		this.h = n;
		this.el.height = n;
	},
	render:function() {

	}
});