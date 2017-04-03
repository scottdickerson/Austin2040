(function() {
	/*
		1. Update timeline
		2. Population increase for turn
		3. Weather Event
		4. Water change for turn
		5. Resources change for turn
		6. Timer starts for current turn
		7. 3 solutions appear
		8. Select a solution
		9. Resources change based on solution
		10. Feedback sequence
		11. Water change based on solution
		12. Check the water level compared to the population level, and determine if the lose state should be triggered
		13. Advance to next turn
	*/



	var Game = Blaze.Application.extend({
		mixins:['hashBinder', 'globalEvents', 'hasViews', 'assetLoader', 'statefull'],
		assets:{
			configs:[ 'xmls/config' ],
			templates:[ 'templates/templates' ]
		},
		globalEvents:{
			'state:set':'state'
		},
		initialize:function() {
			_.bindAll(this, 'createModels', 'createViews', 'startGame');

			this.loadAssets()
				.then(this.loadModel)
				.then(this.createModels)
				.then(this.createViews)
				.then(this.startGame)
				.fail(this.onInitError);
		},
		states:{
			start:{
				enter:function() {}
			},
			round:{
				enter:function() {},
				exit:function() {},
			},
			end:{
				enter:function() {},
				exit:function() {},
			}
		},
		loadModel:function() {
			return Blaze.loadAsset('xmls/structure.xml', 'xml');
		},
		createModels:function(data) {
			// parse model into json
			var parsed = $.xml2json(data, false);

			this.gameEvents = new WeatherEvents(parsed.event);
			this.solutions = new Solutions(parsed.solution);
			this.gameModel = new GameModel(Blaze.Configs.get('GameModel'));

			//console.log(this.gameModel.toJSON());

		},
		createViews:function() {
			// add initial frame html to body
			$('body').append(Blaze.Templates.render('game_container'));

			// create game components
			this.addView('resources', new ResourceMeter({
				model:this.gameModel
			}), '#LeftCol', {
				'tranistion:complete':'next'
			});

			this.addView('timeline', new TimelineMeter({
				model:this.gameModel
			}), '#CenterCol', {
				'tranistion:complete':'next'
			});

			this.addView('water', new WaterMeter({
				model:this.gameModel
			}), '#CenterCol', {
				'tranistion:complete':'next'
			});

			this.addView('water', new PopulationMeter({
				model:this.gameModel
			}), '#CenterCol', {
				'tranistion:complete':'next'
			});

		},
		next:function() {

		},
		startGame:function() {
			this.triggerGlobal('game:ready', this);
			this.state('start');

		},
		onInitError:function(error) {
			console.error(error, error.stack);
		}
	});


	var TimelineMeter = Blaze.View.extend({
		mixins:['hashBinder', 'modelEvents', 'templated', 'transitionable'],
		modelEvents:{
			'change:time':'update'
		},
		initialize:function() {
			this.render();
		},
		render:function() {
			this.update();
		},
		update:function() {
			this.$el.html(this.model.get('resources'));
		},
		updateComplete:function() {
			this.trigger('update:complete', 'resources', this);
		}
	});

	var ResourceMeter = Blaze.View.extend({
		id:'ResourceMeter',
		mixins:['hashBinder', 'modelEvents', 'canvas', 'transitionable'],
		modelEvents:{
			'change:resources':'update'
		},
		initialize:function() {
			this.render();
		},
		render:function() {
			this.update();
		},
		update:function() {
			this.$el.html(this.model.get('resources'));
		},
		updateComplete:function() {
			this.trigger('update:complete', 'resources', this);
		}
	});

	var WaterMeter = Blaze.View.extend({
		mixins:['hashBinder', 'modelEvents', 'templated', 'transitionable'],
		modelEvents:{
			'change:water':'update'
		},
		initialize:function() {
			this.render();
		},
		render:function() {
			this.update();
		},
		update:function() {
			this.$el.html(this.model.get('water'));
		},
		updateComplete:function() {
			this.trigger('update:complete', 'water', this);
		}
	});

	var PopulationMeter = Blaze.View.extend({
		mixins:['hashBinder', 'modelEvents', 'templated', 'transitionable'],
		modelEvents:{
			'change:population':'update'
		},
		initialize:function() {
			this.render();
		},
		render:function() {
			this.update();
		},
		update:function() {
			this.$el.html(this.model.get('population'));
			this.updateComplete();
		},
		updateComplete:function() {
			this.trigger('update:complete', 'population', this);
		}
	});

	var SolutionWheel = Blaze.View.extend({
		mixins:['hashBinder', 'modelEvents', 'templated', 'transitionable']
	});


	var AlertViewer = Blaze.View.extend({
		mixins:[]
	});


	var RoundTimer = function() {

	};


	var GameModel = Blaze.Model.extend({
		increasePop:function(n) {
			var pop = this.get('population');
			this.set('population', pop + n);
		}
	});


	var WeatherEvents = Blaze.Collection.extend({
		initialize:function(events) {
			this.createLikelihoodArray(events);
		},
		getLikelihood:function() {
			return this.get(this.seasons[_.random(this.seasons.length - 1)]);
		},
		// creates an array of model ids
		createLikelihoodArray:function(events) {
			var a = [];

			_.each(events, function(m) {
				var n = m.likelihood;

				// set a unique id on each event
				m.id = _.uniqueId('we_');

				// add to seasons array
				_.times(n, function() {
					a.push(m.id);
				});
			});
			this.seasons = a;
		}

	});

	var Solutions = Blaze.Collection.extend({
		drawSolutions:function() {

		},
		groupByStrategy:function() {
			return this.groupBy('strategy');
		},
		mapByStategy:function() {
			return _(this.toJSON()).chain().groupBy('strategy').map(function(v, k) {
				return {catagory:k, items:v};
			}).value();
		}
	});






	$(document).ready(function() {
		var game = new Game();
	});

})();