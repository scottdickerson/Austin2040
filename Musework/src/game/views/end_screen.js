Blaze.dna.EndScreen = Blaze.View.extend({
	className:'end-screen overlay',
	mixins:['hashBinder', 'globalEvents' ,'templated', 'transitionable'],
	events:{
		'click .js-replay':'use'
	},
	images:['bonedry', 'tinytrickle', 'sadstream', 'fineflow', 'rollingriver'],
	initialize:function() {
		this.render();

		this.$el.hide();


	},
	transitions:{
		show:function(el, view) {
			_.delay(function() {
				view.$('.end-text').show();
			}, 300);
			_.delay(function() {
				view.$('.js-replay').show();
				view.trigger('game:canstart');
			}, 600);
			el.show();
		}

	},
	render:function() {

	},
	open:function(state) {
		var n = this.model.getFinalState();


		this.template('end_screen', {
			outcome:n === 0 ? 'fail' : 'success',
			text:this.images[n]
		});


		this.show();
	},
	use:function() {
		this.trigger('game:restart');
		this.hide();
	},
	show:function() {
		this.transition('show');
	},
	hide:function() {
		this.$el.hide();
	}
});