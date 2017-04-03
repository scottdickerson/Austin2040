Blaze.dna.ResourceMeter = Blaze.View.extend({
	mixins:['hashBinder', 'modelEvents', 'templated', 'transitionable'],
	id:'ResourceMeter',
	h:700,
	w:100,
	className:'resource-meter',
	initialize:function() {
		this.render();
		this._currentlevel = this.getScaledLevel();
		this.sfx = new Howl({
			urls:['audio/coin-04.wav'],
			loop: true
		});
	},
	render:function() {
		this.template('resource_meter');
		this.$('.resource-bar').css('height', this.getScaledLevel()+'px');
		this.updateCounter();
	},
	update:function() {
		var self = this,
			def = Q.defer(),
			n = this.getScaledLevel(),
			c1 = this.$('.resource-coin'),
			c2 = this.$('.resource-coin-sprite');



		if(n != this._currentlevel) {
			this.sfx.play();
			this.$('.resource-bar').animate({height:n+'px'}, 500, function() {
				self.sfx.stop();
				def.resolve();
			});
			c1.hide();
			c2.show().on('webkitAnimationEnd', function() {
				c1.show();
				c2.hide();
			});


		}else{
			def.resolve();
		}
		this._currentlevel = n;
		this.updateCounter();
		return def.promise;
	},
	updateCounter:function(n) {
		this.$('.resource-counter').html(this.model.get('resources'));
	},
	getScaledLevel:function() {
		return _.constrain(_.toScale(this.model.get('resources'), this.model.get('maxResources'), 380), 0, 380);
	}
});
