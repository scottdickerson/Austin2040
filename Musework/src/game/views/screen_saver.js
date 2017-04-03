Blaze.dna.ScreenSaver = Blaze.View.extend({
	className:'screen-saver',
	configid:'ScreenSaver',
	mixins:['templated', 'configurable'],
	events:{
		'click':'finish'
	},
	initialize:function() {
		this.hide();
	},
	hide:function() {
		this.$el.empty();
		this.$el.hide();
	},
	show:function() {
		this.template('screen_saver');
		this.$el.show();
	},
	finish:function() {
		this.trigger('game:return');
	},
	startTimer:function() {
		this.countdown = setTimeout(_.bind(this.show, this), this.config.timer);
	},
	clearTimer:function() {
		clearTimeout(this.countdown);
	}
});