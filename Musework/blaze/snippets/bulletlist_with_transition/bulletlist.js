// make a simple bullet list with a intro transition
// the css animation is done with animo
// you can replace with jquery animate or fadeIn
// or whatever animation library we are current using
var BulletList = Blaze.View.extend({
	mixins:['hashBinder', 'globalEvents', 'templated', 'transitionable'],
	transitions:{
		// a transition literal
		intro:function(el, view) {
			var bullets = el.find('.js-bullet');

			// use visibility if you need the spacing to remain constant
			// hide() will cauase any html after the list to jump as each bullet starts its animating
			//
			// if you wanted to check for css transitions and use jquery fadeIn on old browsers
			// you would
			//  if(!Modernizr.csstransitions) {
			//  	bullet.fadeOut
			//  }else{
			//  	css transition code
			//  }
			bullets.css("visibility", "hidden");
			_.each(bullets, function(b, i) {
				_.delay(function() {
					var bullet = $(b);
					bullet.find('.js-bullet-icon').animo({animation: "spinner", iterate: 5});
					bullet.css("visibility", "visible").animo({animation:"fadeInLeft", duration: 0.3});
				},  i * 1000);
			});
		}
	},
	render:function() {
		this.template('BulletList', this.getTemplateData());
		// this calls the transition intro from the transitionable mixin
		this.mixinAfterRender();

		// if you wish to do some thing after the animation
		/*
			var promises = [];
			this.mixinAfterRender(promises);

			Q.all(promises).then(function() {
				// do some stuff...
			})
		 */
	},
	// get the model data and collapse sBullet0 sBullet1 into [{sBullet:"", i:0}, {sBullet:"", i:1}];
	getTemplateData:function() {
		var m = this.model.toJSON();
		m.bullets = this.model.collapseArgs(['sBullet[n]']);
		return m;
	}
});