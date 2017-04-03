(function() {
	var TextVersion = Blaze.Application.extend({
		mixins:['hashBinder', 'globalEvents',  'assetLoader'],
		assets:{
			configs:[ 'xmls/config' ],
			templates:[ 'templates/templates' ]
		},
		initialize:function() {
			console.log('tester online');
			_.bindAll(this, 'loadModel', 'createModels', 'startTest', 'choose', 'logChoice');
			this.loadAssets()
				.then(this.loadModel)
				.then(this.createModels)
				.then(this.startTest)
				.fail(this.onError);
		},
		loadModel:function() {
			return Blaze.loadAsset('xmls/structure.xml', 'xml');
		},
		createModels:function(data) {
			// parse model into json
			var parsed = $.xml2json(data, false);
			this.gameEvents = new Blaze.dna.WeatherEvents(parsed.event);
			this.solutions  = new Blaze.dna.SolutionCollection(parsed.solution);
			this.gameModel  = new Blaze.dna.GameModel(Blaze.Configs.get('GameModel'));
		},
		startTest:function() {
			this.triggerGlobal('game:ready', this);
			this.log('-----------  Init game values  -----------');
			this.log('<pre>'+JSON.stringify(this.gameModel.toJSON(), undefined, 2)+'</pre>');
			this.log('------------ Start Game  -----------');
			this.startRound();
		},
		onError:function(error) {
			console.error(error, error.stack);
		},
		log:function() {
			_.each(_.toArray(arguments), function(html) {
				if(html) {
					$('#Log').append('<div>'+html+'</div>');
				}
			});
		},
		logModelValue:function(val, pre) {
			this.log(pre, val+': '+this.gameModel.get(val));
		},
		startRound:function() {
			this.gameModel.advanceRound();
			this.log('-----------  Round '+this.gameModel.get('round')+'  -------------');

			this.logModelValue('year', 'Current year');

			this.gameModel.growPopulation();
			this.logModelValue('population', 'Step 1 - adjust popuplation growth');


			var forcast = this.gameEvents.getForcast();
			this.log('Step 2 - forcast weather', 'forcast: ' + forcast.get('title'));

			this.gameModel.accumulateResources();
			this.logModelValue('resources', 'Step 3 - Adjust resources');

			this.gameModel.depleteWater();
			this.logModelValue('water', 'Step 4 - Adjust for water depletion');

			if(this.allDead()) {
				this.endGame();
			}else{
				this.getChoices();
			}


		},
		getChoices:function() {
			this.log('Step 5 - Draw Solutions');
			_.each(this.solutions.draw(), this.logChoice);
			this.log('');
		},
		choose:function(e) {
			var id = $(e.currentTarget).data('id');

			var sol = this.solutions.get(id);

			if(this.gameModel.isAfordable(sol.get('resources'))) {
				this.log('solution cost too high '+sol.get('title'));
				return;
			}

			this.log('choice made: ' + this.solutions.get(id).get('title'));
			this.removeChoiceHooks();
			this.applyChoice(id);
			if(this.allDead()) {
				this.endGame();
			}else if(this.gameModel.isFinalRound()) {
				this.endGame('Win');
			}else{
				this.startRound();
			}

		},
		removeChoiceHooks:function() {
			$('#Log .js-choice').removeClass('js-choice');
		},
		applyChoice:function(id) {
			var s = this.solutions.get(id);
			this.solutions.applyChoice(id);
			this.gameModel.adjustResources(s.get('resources') * -1);
			this.logModelValue('resources', 'Step 6 - Adjust resourecs for choice');
			this.gameModel.adjustWater(s.get('resources'));
			this.logModelValue('water', 'Step 7 - Adjust resourecs for choice');
		},
		logChoice:function(m, i) {
			var s = m.toJSON();
			s.i = i +1;
			this.log(Blaze.Templates.render('testerchoice', s));
		},
		allDead:function() {
			return this.gameModel.isWaterAllGone();
		},
		endGame:function(endstate) {
			endstate = endstate || 'Lose';
			this.log('-------------- GAME OVER  - '+endstate+'------------------');
		}
	});


	$(function() {
		var tester = new TextVersion();
		$('#Log').on('click', '.js-choice', tester.choose);
	});

	Blaze.Templates.addTemplate('testerchoice','<span class="js-choice" data-id="{{id}}">{{i}}:  {{title}} costs -  water: {{water}} , resources: {{resources}}</span>');

})();