// mixin - positionable
//
// requires: none
// usage:
//
//
//
Blaze.Mixer.add('positionable', {
	position:function(x, y) {
		this.$el.css({top:(x || 0)+'px', left:(y || 0)+'px'});
		return this;
	},
	getVector:function() {
		var pos = this.$el.position();
		return [pos.left, pos.top];
	},
	offsetBy:function(x, y) {
		var pos = this.offsetBy();
		this.position(pos[0] + x, pos[1] + y);
	},
	right:function(x) {
		this.$el.css({right:(x || 0)+'px'});
		return this;
	},
	left:function(x) {
		this.$el.css({left:(x || 0)+'px'});
		return this;
	},
	top:function(y) {
		this.$el.css({top:(y || 0)+'px'});
		return this;
	},
	bottom:function(y) {
		this.$el.css({bottom:(y || 0)+'px'});
		return this;
	}
});