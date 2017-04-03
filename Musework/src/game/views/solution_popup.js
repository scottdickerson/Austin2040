Blaze.dna.SolutionPopup = Blaze.View.extend({
	className:'solution-popup animated',
	id:'SolutionPopup',
	mixins:['hashBinder', 'globalEvents' ,'templated', 'transitionable'],
	events:{
		'click .js-use':'use'
	},
	initialize:function() {
		this.$el.hide();
		this.woosh = new Howl({
			urls:['audio/whooshpaper.wav']
		});
	},
	bgs:{
		'Technology':'tech',
		'New Sources':'new',
		'Conservation':'conservation'
	},
	open:function(id) {
		this.solution = this.collection.get(id);


		this.template('popup', this.getTemplateData());
		//this.$('.solution-icon').destroy();

		this.setBackgroundImg(this.bgs[this.solution.get('strategy')]);
		this.woosh.play();
		this.show();
	},
	getTemplateData:function(solution) {
		var m = this.solution.toJSON();
		m.enabled = this.model.isAfordable(m.resources);
		return m;
	},
	setBackgroundImg:function(startegy) {
		this.$el.css('background-image', 'url(images/solutions/popup-bg-'+startegy+'.png)');
	},
	use:function() {
		this.trigger('solution:use', this.solution, this);
	},
	show:function() {
		this.$el.show().removeClass('bounceOutDown').addClass('bounceInUp');

	},
	hide:function() {
		var el = this.$el;

		this.woosh.play();
		if(el.hasClass('bounceInUp')) {
			el.removeClass('bounceInUp').addClass('bounceOutDown');
		}else{
			el.hide();
		}
	}
});