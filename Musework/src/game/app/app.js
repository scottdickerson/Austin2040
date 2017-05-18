

/*
Application flow

Update timeline
“Between Turns” text appears in place of wheel
Weather Event text/icon appears within “Between Turns” text
Different Between Turns text for each round… 1 version for each event
Normal 70% chance (invisible to player)
Rainy season 10% chance
Drought 10% chance
Severe drought 10% chance
Spin button is disabled and/or invisible
Population increase for turn
Resources change for turn
Water change for turn
Spin!
Spin button is enabled below “Between Turns” text from #2
Timer starts for current turn
3 solutions appear
Select a solution from wheel
Selected solution has selected state… remains selected through #15
Solution detail appears in popup
Click “Use”
Solution detail popup closes
Resources change based on solution
Water change based on solution
Check the water level compared to the population level, and determine if the lose state should be triggered
Advance to next turn

*/



Blaze.dna.Game = Blaze.Application.extend({
	mixins:['hashBinder', 'globalEvents', 'hasViews', 'assetLoader'],
	assets:{
		configs:[ 'xmls/config' ],
		templates:[ 'templates/templates' ],
		labels:['xmls/labels']
	},
	globalEvents:{
		'state:set':'state'
	},
	initialize:function() {
		_.bindAll(this, 'createModels', 'onGameReady', 'createViews', 'startGame', 'startGameWithoutTimer', 'startGameWithTimer', 'startRound', 'next', 'updateTimeline', 'adjustPopulation', 'forcastWeather', 'adjustWater', 'adjustResources', 'startRoundTimer', 'showSolutions', 'selectSolution', 'showSolutionPrompt', 'adjustPopRes');


		this.loadAssets()
			.then(this.loadModel)
			.then(this.createModels)
			.then(this.createViews)
			.then(this.onGameReady)
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
	createViews:function() {
		// add initial frame html to body
		$('body').append(Blaze.Templates.render('game_container'));

		// create game components
		this.addView('start', new Blaze.dna.StartScreen(
		), "#GameFrame", {
            'game:start':'startGame',
            'game:startWithoutTimer':'startGameWithoutTimer',
            'game:startWithTimer':'startGameWithTimer',
			'game:canstart':'startScreenSaverTimer'
		});

		this.addView('resources', new Blaze.dna.ResourceMeter({
			model:this.gameModel
		}), '#LeftCol', {
			'tranistion:complete':'next'
		});

		this.addView('landscape', new Blaze.dna.Landscape({
			model:this.gameModel
		}), '#CenterCol');

		this.addView('timeline', new Blaze.dna.TimelineMeter({
			model:this.gameModel
		}), '#GameFrame', {
			'tranistion:complete':'next',
			'game:return':'restart',
            'game:skipIntro':'skipIntro'
		});

		this.addView('water', new Blaze.dna.WaterMeter({
			model:this.gameModel
		}), '#CenterCol', {
			'tranistion:complete':'next'
		});

		this.addView('population', new Blaze.dna.PopulationMeter({
			model:this.gameModel
		}), '#CenterCol');

		this.addView('wheel', new Blaze.dna.SolutionWheel({
			collection:this.solutions,
			model:this.gameModel
		}), '#RightCol', {
			'solution:details':'showDetails'//,
			//'solutions:ready':'startRoundTimer'
		});

		this.addView('popup', new Blaze.dna.SolutionPopup({
			collection:this.solutions,
			model:this.gameModel
		}), '#GameFrame', {
			'solution:use':'selectSolution'
		});

        this.addView('moretime', new Blaze.dna.MoreTime({
            model:this.gameModel
        }), '#GameFrame', {
            'moretime:yes':'yes',
            'game:canstart':'startScreenSaverTimer',
            'game:cannotstart':'clearScreenSaverTimer'
        });

		this.addView('end', new Blaze.dna.EndScreen({
			model:this.gameModel
		}), '#GameFrame', {
			'game:restart':'restart',
			'game:canstart':'startScreenSaverTimer'
		});

		this.addView('title', new Blaze.dna.TitleScreen({
			model:this.gameModel
		}), '#RightCol', {
			'game:start':'startGame',
            'game:startWithoutTimer':'startGameWithoutTimer',
            'game:startWithTimer':'startGameWithTimer',
			'game:spin':'showSolutions'
		});

		this.addView('timer', new Blaze.dna.RoundTimer(), '#LeftCol', {
			'time:expired':'onTimeUp'
		});

		this.addView('saver', new Blaze.dna.ScreenSaver(), 'Body', {
			'game:return':'restart'
		});

	},
	onGameReady:function() {
		this.triggerGlobal('game:ready', this);
		this.showInstructions();
		//this.startGame();
		//this.endGame();
	},
	startScreenSaverTimer:function() {
		this.getView('saver').startTimer();
	},
    clearScreenSaverTimer:function() {
        this.getView('saver').clearTimer();
    },
	showInstructions:function() {
		this.getView('start').show();
	},
	skipIntro: function() {
        this.getView('start').skipIntro();
	},
	startGame:function() {
        this.getView('start').hide();
        this.getView('timer').hide();
        this.getView('saver').clearTimer();
        this.getView('timeline').hideSkipIntro();
        this.gameModel.reset();
        this.gameModel.advanceRound();
        this.triggerGlobal('game:start', this.gameModel);
        this.startRound();
    },
    startGameWithTimer:function() {
        this.showTimer=true;
        this.startGame();
    },
    startWarningTimer: function() {
        // Start the warning timer
        this.getView('moretime').startTimer();
	},
    startGameWithoutTimer:function() {
        this.showTimer=false;
        this.startGame();
    },
	startRound:function() {
		this.triggerGlobal('game:round:start');
		this.gameModel.depleteWater();
		this.gameModel.growPopulation();
		this.gameModel.advanceRound();
		this.gameModel.accumulateResources();
		this.getView('timeline').up();
        //Need to have the screensaver end the game
        if (!this.showTimer) {
            this.startWarningTimer();
        }
		Q.fcall(this.updateTimeline)
			.then(this.adjustPopulation)
			.then(this.adjustResources)
			.then(this.adjustWater)
			.then(this.forcastWeather)
			.then(this.adjustWater)
			.then(this.showSolutionPrompt)
			.then(this.startRoundTimer)
			.fail(this.onError);
	},
	// 1. Update timeline
	updateTimeline:function() {
		this.triggerGlobal('game:updateTimeline');
		return this.getView('timeline').update();
	},
	// 2. Population increase for turn
	adjustPopulation:function() {
		this.triggerGlobal('game:adjustPopulation', this.gameModel.get('population'));
		return this.getView('population').update();
	},
	adjustPopRes:function() {
		return Q.all([this.adjustPopulation(), this.adjustResources()]);
	},
	// 3. Weather Event
	forcastWeather:function() {
		// choose a weather event, if is normal just move on otherwise activate broadcast system!!
		var forcast = this.gameEvents.getForcast();

		this.triggerGlobal('game:forcastWeather', forcast.get('title'));
		this.gameModel.set('weather', forcast.get('icon'));
		this.gameModel.set('isExtreme', forcast.isExtreme());
		this.gameModel.incCounter('water', forcast.getWaterCost());
		return this.getView('title').update();
	},
	// 4. Water change for turn
	adjustWater:function() {
		return this.getView('water').update().then(function() {
			Blaze.dispatcher.trigger('game:adjustWater');
		});
	},

	// 5. Resources change for turn
	adjustResources:function() {
		//console.log('adjustResources');
		// update to trigger when promise resolved
		this.triggerGlobal('game:adjustResouces');
		this.getView('resources').update();
	},

	// 6. Timer starts for current turn
	startRoundTimer:function() {
		if(!this.gameModel.isEnded() && this.showTimer) {
			this.getView('timer').startTimer();
		}
	},
	showSolutionPrompt:function() {
		if(this.allDead()) {
			this.endGame();
		}else{
			return this.getView('title').showPrompt();
		}

	},
	// 7. 3 solutions appear
	showSolutions:function() {
		//console.log('showSolutions');

		this.getView('wheel').spin();
	},
	// 8. Select a solution
	// 9. Resources change based on solution
	selectSolution:function(solution) {


		if(solution) {
			solution.use();
			this.gameModel.depleteResources(solution.get('resources'));
			this.gameModel.adjustWater(solution.get('water'));
		}

		this.getView('popup').hide();
        if (this.showTimer)
            this.getView('timer').stopTimer();
        //clear the screensaver timer
        this.getView('saver').clearTimer();
		this.getView('wheel').hide();

		Q.fcall(this.adjustResources)
			.then(this.adjustWater)
			.then(this.next)
			.fail(this.onError);

	},
	// 11. Water change based on solution
	// 12. Check the water level compared to the population level, and determine if the lose state should be triggered
	allDead:function() {
		return this.gameModel.isWaterAllGone();
	},
	advanceOrEnd:function() {

	},
	endGame:function(state) {
		this.gameModel.setEnded(this.getView('water').getFinalRowNum());
		this.getView('timeline').down();
		this.getView('end').open();
	},

	// 13. Advance to next turn
	next:function() {
		this.getView('wheel').hide();
		this.getView('title').hide();// protect against spin timeing bug
		if(this.allDead()) {
			this.endGame();
		}else if(this.gameModel.isFinalRound()) {
			this.endGame('Win');
		}else{
			this.startRound();
		}
	},
	showDetails:function(id) {
		//console.log('show details', id);
		this.getView('popup').open(id);
	},
	onTimeUp:function() {
		this.selectSolution();
	},
	restart:function() {
		// for now just refresh page
		window.location.reload();
	},
	onError:function(error) {
		console.error(error, error.stack);
	}
});













