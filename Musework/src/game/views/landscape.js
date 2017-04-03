Blaze.dna.Landscape = Blaze.View.extend({
	mixins:['hashBinder','globalEvents', 'configurable'],
	className:'landscape-overlay',
	configid:'landscape',
	globalEvents:{
		'game:adjustWater':'update'
	},
	initialize:function() {},
	update:function() {
		this.$el.animate({
			opacity:this.getAmt(Blaze.app.getView('water').getFinalRowNum())
		}, 500);
	},
	getAmt:function(n) {
		return this.config.ammounts[n];
	}
});