Blaze.dna.TimelineMeter = Blaze.View.extend({
	className:'header down',
	id:'Header',
	mixins:['hashBinder', 'modelEvents', 'templated', 'transitionable'],
	events:{
		'click .header-restart-button':'restart',
        'click .skip-intro-button': 'skipIntro',
	},
	transitions:{
		year:function(el, view) {
			var pause = 200,
				def = Q.defer(),
				dots = view.$el.find('.y'+view.model.get('round')+' .dot');

			_.each(dots, function(d, i) {
				_.delay(function() {
					$(d).removeClass('hidden').addClass('bounceIn');
				}, i * pause);

			});

			_.delay(function() {
				def.resolve();
			}, (dots.length * pause) + 300);
			return def.promise;

		}
	},
	initialize:function() {
		this.render();
	},
	render:function() {
		this.template('timeline', {years:_.range(1,7)});
		this.update();
	},
	update:function() {
		return this.transition('year');
	},
	updateComplete:function() {
		this.trigger('update:complete', 'timeline', this);
	},
	up:function() {
		this.$el.addClass('up');
	},
	down:function() {
		this.$el.removeClass('up');
	},
	hideAll:function() {
		this.$('.dot').addClass('hidden').removeClass('bounceIn');
	},
	restart:function() {
		this.trigger('game:return');
	},
    skipIntro:function() {
        this.trigger('game:skipIntro');
    },
	hideSkipIntro: function() {
        this.$('.skip-intro-button').hide();
	},
	showSkipIntro: function() {
        this.$('.skip-intro-button').show();
    },
});