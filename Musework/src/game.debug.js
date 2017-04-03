Blaze.Debug.addPanel('solutions',  Blaze.Debug.Panel.extend({
	globalEvents:{
		'game:ready':'render'
	},
	render:function(game) {
		this.$el.append(Blaze.Templates.render('debug_solutions', {
			solutions:game.solutions.mapByStategy()
		}));
	},
	getPanelHelp:function() {
		return 'custom debug panel for Austin 2040';
	}

}));

Blaze.Debug.addPanel('events',  Blaze.Debug.Panel.extend({
	globalEvents:{
		'game:ready':'render'
	},
	events:{
		'click .debug-get-likelihood':'getLikelihood'
	},
	render:function(game) {

		this.ge = game.gameEvents;

		this.$el.append(Blaze.Templates.render('debug_events', {
			events: this.ge.toJSON()
		}));

	},
	getLikelihood:function() {
		var e = this.ge.getForcast().get('description');
		this.run = (e == this.re) ? this.run + 1 : 1;
		this.$('.debug-random-game-event').html(e + ' ('+this.run+')');
		this.re = e;
	},
	getPanelHelp:function() {
		return 'custom debug panel for Austin 2040';
	}
}));


Blaze.Debug.addPanel('game', Blaze.Debug.Panel.extend({
	globalEvents:{
		'game:ready':'panelReady'
	},
	panelReady:function(game) {
		this.model = game.gameModel
		this.hashbind(game.gameModel, { 'change':'render' });
		this.render();
	},
	render:function(game) {
		this.$el.html(Blaze.Templates.render('debug_game', this.model.toJSON() ));
	},
	getPanelHelp:function() {
		return 'custom debug panel for Austin 2040';
	}
}));