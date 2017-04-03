// mixin - toggleVisible
//
// requires:
// usage:
//
//
//
//
Blaze.Mixer.add('toggleVisible', {
	mixinBeforeInitialize:function() {
		this._visible = true;
	},
	hide:function() {
		this._visible = false;
		if(this.useVisibleProp) {
			this.$el.css({visibility:"hidden"});
		} else {
			this.$el.hide();
		}
		this.onHide();
		this.trigger("hide");
	},
	show:function() {
		this._visible = true;
		if(this.useVisibleProp) {
			this.$el.css({visibility:"visible"});
		}else{
			this.$el.show();
		}
		this.onShow();
		this.trigger("show");
	},
	onShow:function() {},
	onHide:function() {},
	toggleVisible:function() {
		this.setVisible(!this._visible);
	},
	setVisible:function(b) {
		if(b) {
			this.show();
		}else{
			this.hide();
		}
	},
	isVisible:function() {
		return this._visible;
	}
});