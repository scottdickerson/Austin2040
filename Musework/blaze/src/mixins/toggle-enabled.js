// mixin - toggleEnabled
//
// requires:
// usage:
//
//
//
Blaze.Mixer.add('toggleEnabled', {
	mixinBeforeInitialize:function() {
		this._enabled = true;
	},
	enable:function() {
		this._enabled = true;
		this.trigger("enabled");
		if(this.$el) {
			this.$el.removeClass('disabled').addClass('enabled');
		}
		this.onEnabled();
	},
	disable:function() {
		this._enabled = false;
		this.trigger("disabled");
		if(this.$el) {
			this.$el.removeClass('enabled').addClass('disabled');
		}
		this.onDisabled();
	},
	toggleEnabled:function(b) {
		if(!_.isBoolean(b)) {
			b = !this._enabled;
		}
		this.setEnabled(b);
	},
	onEnabled:function() {},
	onDisabled:function() {},
	setEnabled:function(b) {
		if(b) {
			this.enable();
		}else{
			this.disable();
		}
	},
	isEnabled:function() {
		return this._enabled;
	}
});