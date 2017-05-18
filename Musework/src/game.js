/*! this is a compiled file do not change austin2040.core - v0.1.0 - 2017-05-17 */
(function() {
var i = 0;

Blaze.dna.GameModel = Blaze.Model.extend({
	initialize:function(attrs) {
		this.calcYears(attrs.startYear, attrs.endYear, attrs.rounds);
		attrs.round = -1;
		this.gauges = {};
	},
	getGaugedAmmount:function(gaugeId, baseValueId) {
		if(!this.gauges[gaugeId]) {

			//console.log('BASE WATER AMMOUNT', baseValueId, this.get(baseValueId));
			return this.get(baseValueId);
		}
		return _.reduce(this.gauges[gaugeId] || [], function(sum, n) {
			if(!_.isNumber(parseInt(n))) { return sum; }
			return sum + parseInt(n);
		}, this.get(baseValueId));
	},
	addGauge:function(gaugeId, n) {

		if(!this.gauges[guageId]) {
			this.gauges[guageId] = [];
		}
		this.gauges[guageId].push(n);
	},
	growPopulation:function() {
		this.adjustPop(this.getGaugedAmmount('resources', 'basePopulationGrowth'));
	},
	adjustPop:function(n) {
		this.incCounter('population', this.getNumeric(n));
	},
	accumulateResources:function() {
		this.adjustResources(this.getGaugedAmmount('resources', 'baseResourceAccumulation'));
	},
	adjustResources:function(n) {
		this.incCounter('resources', this.getNumeric(n));
	},
	depleteResources:function(n) {
		this.decCounter('resources', this.getNumeric(n));
	},
	depleteWater:function(n) {
		this.decCounter('water', this.getGaugedAmmount('water', 'baseWaterUsage'));

		if(this.get('water') < 0) {
			this.set('water', 0);
		}
	},
	adjustWater:function(n) {
		this.incCounter('water', this.getNumeric(n));
	},
	getNumeric:function(n) {
		if(_.isString(n)) { n = parseInt(n); }
		return _.isNumber(n) ? n : 0;
	},
	calcYears:function(startYear, endYear, nRounds) {
		var years = [], year, timespan = (endYear - startYear),
			basetick = Math.floor(timespan / (nRounds - 1)),
			offset = timespan - (basetick * (nRounds - 1));

		_.each(_.range(nRounds), function(i) {
			if(year) {
				year = year + basetick;

				if(offset > 0) {
					year = year + 1;
					offset = offset-1;
				}
			}else{
				year = startYear;
			}
			years.push(year);
		});
		this.years = years;
	},
	setYear:function(nRound) {
		this.set('year', this.years[nRound - 1]);
	},
	advanceRound:function() {
		this.incCounter('round', 1);
		this.setYear(this.get('round'));
	},
	reset:function() {
		this.set('round', -1);
		this.set('year', '');
	},
	isWaterAllGone:function() {
		return this.get('water') < 0;
	},
	isAfordable:function(cost) {
		return cost <= this.get('resources');
	},
	isFinalRound:function() {
		return this.get('round') == this.get('rounds');
	},
	/*getLandStatus:function() {
		var n = this.get('water'),
			t3 = this.get('maxWater') / 3;

		if(n < t3) {
			return 'dying';
		}else if(n < t3 * 2){
			return 'stressed';
		}
		return 'healthy';

	},*/
	getFinalState:function() {
		return this.get('endState');
	},
	getHappinessLevel:function() {
		var lvl,
			outcomes = ['supersad', 'sad',  'happy', 'happy', 'happy', 'happy'],
			n = this.get('water');

		if(n < 1) { n = 0; }
		lvl = _.toScale(n, this.get('maxWater'), 5) - 1;
		if(lvl < 0) {
			lvl = 0;
		}
		return outcomes[lvl];
	},
	setEnded:function(n) {
		this.set('endState', n);
		this.set('ended', true);
	},
	isEnded:function() {
		return this.get('ended') === true;
	}
 });
})();
(function() {
Blaze.dna.SolutionModel = Blaze.Model.extend({
	use:function() {
		this.set('applied', true);
	},
	reset:function() {
		this.set('applied', null);
	},
	isUsed:function() {
		return this.get('applied') === true;
	},
	hasAdjustement:function() {
		return !_isUndefined(this.get('adjust_water'));
	},
	getAdjustment:function(argument) {
		if(this.hasAdjustement()) {
			return this.get('adjust_water');
		}
	},
	isMultiplier:function() {
		return this.get('adjust_water') > 0;
	}
});

Blaze.dna.SolutionCollection = Blaze.Collection.extend({
	model:Blaze.dna.SolutionModel,
	drawSolutions:function() {
		if(!this.smap) {
			this.makeStategyMap();
		}

		return _.reduce(this.smap, function(a, c) {
			a.push(_.sample(c.items, 1)[0]);
			return a;
		}, []);
	},
	groupByStrategy:function() {
		return this.groupBy('strategy');
	},
	mapByStategy:function() {
		return _(this.toJSON()).chain().groupBy('strategy').map(function(v, k) {
			return {catagory:k, items:v};
		}).value();
	},
	makeStategyMap:function() {
		this.smap = this.mapByStategy();
		//console.log('solution map', this.smap);
	},
	draw:function(cnt) {
		var selectedSolutions = this.chain().filter(function(m) {
			return !m.isUsed();
		}).shuffle().first(cnt || 3).value();

		// If every solution is not affordable draw again
		if (selectedSolutions.every(function(solution) {
			return !Blaze.app.gameModel.isAfordable(solution.get("resources"));
		})) {
            return this.draw(cnt || 3);
		} else {
            return selectedSolutions;
        }
	},
	listUsed:function() {
		return this.chain().filter(function(m) { return m.get('applied'); }).pluck('id').value();
	},
	getMultiplier:function() {
		return this.chain().filter(function(m) {
			return m.get('adjust_water') > 0;
		}).shuffle().first().value();
	},
});
})();
(function() {
var Timer = function() {

};
})();
(function() {
Blaze.dna.WeatherEvent = Blaze.Model.extend({
	isExtreme:function() {
		return this.get('condition') == 'extreme';
	},
	getWaterCost:function() {
		var n = parseInt(this.get('water'));
		return _.isNaN(n) ? 0 : n;
	}
});

Blaze.dna.WeatherEvents = Blaze.Collection.extend({
	model:Blaze.dna.WeatherEvent,
	initialize:function(events) {
		this.createLikelihoodArray(events);
	},
	getForcast:function() {
		var n = _.random(this.seasons.length - 1);
		return this.get(this.seasons[n]);
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
})();
(function() {
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
})();
(function() {
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
})();
(function() {
Blaze.dna.MoreTime = Blaze.View.extend({
    className:'moretime overlay',
    configid:'MoreTime',
    mixins:['hashBinder', 'globalEvents' ,'templated', 'configurable'],
    events:{
        'click .js-yes':'yes'
    },
    initialize:function() {
        this.render();
        this.$el.hide();
    },
    render:function() {

    },
    open:function(state) {

        this.template('moretime', {title: "Do you need more time"
        });
        // Start the screensaver timer ticking here
        this.trigger('game:canstart');
        this.show();
        this.touchListener = document.addEventListener("touchstart", _.bind(this.yes, this), false);
        this.mouseListener = document.addEventListener("mousedown", _.bind(this.yes, this), false);
    },
    yes:function() {
        this.hide();
        // Clear the screensaver timer ticking here
        this.trigger('game:cannotstart');
        // restart the warning timer
        this.clearTimer();
        this.startTimer();
        document.removeEventListener("touchstart", this.yes, false);
        document.removeEventListener("mousedown", this.yes, false);
    },
    show:function() {
        this.$el.show();
    },
    hide:function() {
        this.$el.hide();
    },
    startTimer:function() {
        this.countdown = setTimeout(_.bind(this.open, this), this.config.timer);
    },
    clearTimer:function() {
        clearTimeout(this.countdown);
    }
});
})();
(function() {
Blaze.dna.PopulationMeter = Blaze.View.extend({
	mixins:['hashBinder', 'globalEvents', 'modelEvents', 'templated', 'transitionable'],
	className:'population-meter',
	rowLength:3,
	colLength:17,
	globalEvents:{
		'game:adjustWater':'setHappinessLevel'
	},
	initialize:function() {
		this._people = [];
		this._level = 0;
		this.pop = new Howl({ urls:['audio/popup5.wav'] });
		this.maxPop = this.model.get('population') + (this.model.get('basePopulationGrowth') * this.model.get('rounds'));
		this.render();

	},
	render:function() {
		this.makeGrid();
	},
	update:function() {
		var def = Q.defer(),
			n = this.getScaledLevel();

		if(this._currentlevel == n) {
			def.resolve();
			return def.promise;
		}

		this._currentlevel = n;
		return this.setLevel(n, def);

	},
	updateComplete:function() {
		this.trigger('update:complete', 'population', this);
	},
	makeGrid:function() {
		_.each(_.range(this.colLength), function(c) {
			_.each(_.range(this.rowLength).reverse(), function(r) {
				this.makeTile(c, r);
			}, this);
		}, this);
	},
	makeTile:function(c, r) {
		var h = 70,
			w = 70,
			id = 'p_'+c+'_'+r,
			tile = $('<div>').attr({
				'class':'person hidden person-'+_.random(1,7),
				'id':id,
			}).css({
				top:h * r,
				left:w * c
			});

		this._people.push(tile);
		this.$el.append(tile);
	},
	setLevel:function(to, def) {
		var range = _.range(this._level, _.constrain(to + 1, 0, this._people.length), 1);

		_.each(range, function(n, i) {
			var tile = this._people[n];
			if(!tile) { return; }
			this.animateTile(tile, i, i == range.length - 1 ? def : null);
		}, this);
		this._level = to;
		return def.promise;
	},
	animateTile:function(tile, i, def) {
		var self = this;
		return _.delay(function() {
			self.pop.play();
			tile.removeClass('hidden').css({top:'+=20px', opacity:0}).animate({top:'-=20px', opacity:1} , function() {
				if(def) { def.resolve(); }
			});
		}, i * 100);
	},
	getScaledLevel:function() {
		return _.constrain(_.toScale(this.model.get('population'), this.maxPop, this._people.length), 0, this._people.length);
	},
	setHappinessLevel:function() {
		var lvl = this.model.getHappinessLevel();
		//console.log('SET HAPPiness Level', lvl);
		this.$el.removeClass('happy sad supersad').addClass(lvl);
	}

});
})();
(function() {
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

})();
(function() {
Blaze.dna.RoundTimer = Blaze.View.extend({
	mixins:['templated'],
	id:'RoundTimer',
	className:'round-timer animated',
	numwidth:54,
	numtime:30,

	initialize:function() {
		_.bindAll(this, 'setTime');
		this.render();
		this.hide();
		this.tick = new Howl({
			urls:['audio/clicks3.wav']
		});
		this.buzz = new Howl({
			urls:['audio/buzz2.wav'],
			volume: 0.5
		});



	},
	render:function() {
		this.template('round_timer');
	},
	setTime:function() {
		var n = this.seconds;


		var a = _.map(n.toString().split(''), function(num) { return parseInt(num); });

		if(a.length === 1) {
			a.unshift(0);
		}
		this.setDialPos(1, a[0]);
		this.setDialPos(2, a[1]);

		this.seconds--;



		if(n === 0) {
			this.timeUp();
			this.buzz.play();
			return;
		}else{
			this.tick.play();
		}

		this.timer = setTimeout(this.setTime, 1000);
	},
	setDialPos:function(dial, n) {
		this.$('#TimerDigit'+dial).css('background-position', this.calcNumPos(n)+ 'px 0');
	},
	calcNumPos:function(n) {
		if(n === 0) {

			n = 10; }
		return ((n * this.numwidth) * -1) + this.numwidth ;
	},
	startTimer:function() {
		this.seconds = this.numtime;
		this.setTime();
		this.show();
	},
	timeUp:function() {
		this.trigger('time:expired');
	},
	stopTimer:function() {
		clearTimeout(this.timer);
		this.setDialPos(1, -1);
		this.setDialPos(2, -1);
		this.hide();
	},
	show:function() {
		this.$el.show().removeClass('bounceInRight').addClass('bounceInLeft');
	},
	hide:function() {
		var el = this.$el;
		if(el.hasClass('bounceInUp')) {
			el.removeClass('bounceInRight').addClass('bounceOutLeft').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
				el.hide().removeClass('bounceOutLeft');
			});
		}else{
			el.hide();
		}
	},
	intro:function() {
		this.setDialPos(1, 2);
		this.setDialPos(2, 0);
		this.show();
	}
});
})();
(function() {
Blaze.dna.ScreenSaver = Blaze.View.extend({
	className:'screen-saver',
	configid:'ScreenSaver',
	mixins:['templated', 'configurable'],
	events:{
		'click':'finish'
	},
	initialize:function() {
		this.hide();
	},
	hide:function() {
		this.$el.empty();
		this.$el.hide();
	},
	show:function() {
		this.template('screen_saver');
		this.$el.show();
	},
	finish:function() {
		this.trigger('game:return');
	},
	startTimer:function() {
		this.countdown = setTimeout(_.bind(this.show, this), this.config.timer);
	},
	clearTimer:function() {
		clearTimeout(this.countdown);
	}
});
})();
(function() {
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
})();
(function() {
Blaze.dna.SolutionWheel = Blaze.View.extend({
	className:'solution-wheel',
	id:'SolutionWheel',
	configid:'SolutionWheel',
	mixins:['hashBinder', 'globalEvents', 'configurable', 'modelEvents', 'toggleVisible', 'templated', 'transitionable', 'animator'],
	events:{
		'click .js-option':'choose'
	},
	initialize:function() {
		this.hide();
		this.tick = new Howl({
			urls:['audio/click1.wav']
		});
	},
	spin:function() {
		this.makeSolutions();
	},
	choose:function(e) {
		this.trigger('solution:details', $(e.currentTarget).data('solution'));
	},
	makeSolutions:function() {
		// draw solutions
		this.createSolutions();
		this.startSpin();
		this.show();
	},
	createSolutions:function() {
		var rest,
			isFirst  = this.model.get('round') == 1,
			drawn = this.collection.draw();

		if(isFirst) {
			if(!_.find(drawn, function(m) {return m.isMultiplier(); })) {
				// make sure we have a muliplier available in the frist round
				drawn[0] = this.collection.getMultiplier();
			}
		}

		rest = _.shuffle(this.collection.difference(drawn));

		console.log('Drawn', drawn);
		this.solutions = _.map(rest.concat(drawn), this.createSolution, this);
		this.lastSolutionId = _.last(rest).id;
	},
	createSolution:function(solution, i) {
		var m, el;

		m = solution.toJSON();
		m.y = ((i * 353)+30) * -1;

		el = $(Blaze.Templates.render('solution_option', m));
		m.el = el;
		this.$el.append(el);
		return m;
	},
	getHighest:function() {
		return _.min(this.solutions, function(m) { return m.y; });
	},
	getLoweset:function() {
		return _.max(this.solutions, function(m) { return m.y; });
	},
	startSpin:function() {
		this.speed = this.config.startSpeed;
		this.startAnimation();
	},
	onAnimationFrame:function(time) {
		var high, low, last;
		// calculate new position
		_.each(this.solutions, this.calcNewPos, this);

		// check to see if we are out of bounds at the top
		high = this.getHighest();
		low = this.getLoweset();

		// if so move the bottom to the top
		if(low.y > 1080) {
			low.y = high.y - 353;
			last = low.id == this.lastSolutionId;
			this.tick.play();
			this.applyDeacy();
		}
		_.each(this.solutions, this.updatePos, this);
		if(this.speed < this.config.stopThreshold && last) {
			this.finshSpin();
			return false;
		}
	},
	finshSpin:function(){
		_.each(_.last(this.solutions, 3), function(s) {
			s.el.addClass('js-option');
		});
		this.trigger('solutions:ready');
	},
	adjustWheel:function() {

	},
	calcNewPos:function(s) {
		s.y = s.y + this.speed;
	},
	updatePos:function(s) {
		s.el.css('top', s.y+'px');
	},
	applyDeacy:function() {
		this.speed = this.speed * this.config.spinDecay;
	},
	onHide:function() {
		this.stopAnimation();
		this.$el.empty();
		this.solutions = null;
	}
});






})();
(function() {
Blaze.dna.StartScreen = Blaze.View.extend({
	className:'start-screen overlay',
	configid:'StartScreen',
	mixins:['templated', 'configurable'],
	events:{
		'click .play-button':'start',
		'click .play-button2':'startWithTimer',
	},
	initialize:function() {
		_.bindAll(this, 'next', 'showPlay');
		this.totalHelp = 4;
		this.template('start_screen');
		this.hide();
		this.continue=true;
	},
	instruct:function() {
		_.delay(this.next, this.config.instructionTime);
	},
	next:function() {
		console.log('next called', this.count);
		if(this.continue) {
			if(this.count < this.totalHelp) {
				this.$('.how-'+this.count).hide();
			}
			this.count++;
			if(this.count > this.totalHelp) {
				_.delay(this.showPlay, 300);
			}else{
				this.$('.how-'+this.count).show();
				this.instruct();
			}
        }
	},
    skipIntro:function() {
        //Stop the help messages
        this.$('.how-'+this.count).hide();
        this.continue = false;
        this.showPlay();
    },
	start:function() {
		this.trigger('game:startWithoutTimer');
	},
    startWithTimer:function() {
        this.trigger('game:startWithTimer');
    },
	hide:function() {
		this.$el.hide();
	},
	show:function() {
		this.$el.show();
		this.count = 0;
		// after title animates in
		_.delay(this.next, 500);
	},
	showPlay:function() {
		this.$('.play-button').show();
		this.$('.play-button2').show();
		// Hide the last one shown
        this.$('.how-'+this.totalHelp).hide();
		this.$('.how-'+this.count).hide();
        this.$('.beginner').show();
        this.$('.advanced').show();
		this.trigger('game:canstart');
	}
});
})();
(function() {
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
})();
(function() {
Blaze.dna.TitleScreen = Blaze.View.extend({
	className:'title-screen',
	id:'TitleScreen',
	configid:'RoundTexts',
	mixins:['templated', 'transitionable', 'configurable'],
	transitions:{
		text1:function(el, view) {
			var def = Q.defer(),
				texts = view.$('.section-0'),
				fc = view.model.get('weather') || 'normal';

			_.each(texts, function(text, i) {
				_.delay(function() {
					$(text).removeClass('hidden');
					view.sfx.play();
				}, i * view.config.textDelay);
			});
			_.delay(function() {

				view.$('.forcast').removeClass('hidden');
				if(fc == 'normal' || fc == 'rainy') {
					view.ping.play();
				}else{
					view.screw.play();
				}
				_.delay(function() {
					def.resolve();
				}, 500);
			}, (texts.length + 1) * view.config.textDelay);

			return def.promise;
		},
		text2:function(el, view) {
			var def = Q.defer(),
				time = view.config.textDelay,
				texts = view.$('.section-1'),
				end = texts.length + 1;


			_.each(texts, function(text, i) {
				_.delay(function() {
					$(text).removeClass('hidden');
					view.sfx.play();
				}, i * time);
			});
			_.delay(function() {
				this.$('.prompt').removeClass('hidden');
				_.delay(function() {
					def.resolve();
				}, 200);
			}, end * time);


			return def.promise;
		}
	},
	initialize:function() {
		this.render();
		this.screw = new Howl({
			urls:['audio/screw.wav']
		});
		this.ping = new Howl({
			urls:['audio/rainy.wav']
		});
		this.sfx = new Howl({
			urls:['audio/text.wav']
		});
		this._active = false;
	},
	render:function() {
		this.template('round_screen');
		//var evt = _.isTouch()  ? 'touchend' : 'click';
		//this.$('.js-prompt').on(evt, _.bind(this.spinWheel, this));
	},
	events:{
		'click .js-prompt':'spinWheel'//,
		//'touchend .js-prompt':'spinWheel'
	},
	update:function() {
		var m = this.model.toJSON(),
			roundOrder = this.config['round'+m.round];

		this._active = true;
		this.order = roundOrder ? roundOrder.split(',') : [];
		return this.setRoundText(m.round, m.weather);

	},
	showSlideButton:function() {
		this.$('.instructions').show();
	},
	setRoundText:function(round, weather) {
		var el;


		el = this.$('.round-info');

		el.empty();
		this.$('.prompt').addClass('hidden');

		if(!weather) {
			weather = "normal";
		}

		var section = 0;
		_.each(this.order, function(item) {
			if(item == "forcast") {
				el.append(this.getTemplate('forcast', {
					weather:weather
				}));
				section = 1;
			}else{
				el.append(this.getTemplate('text_bubble', {
					round:round,
					text:item,
					section:section
				}));
			}
		}, this);

		this.$el.show();



		return this.transition('text1');
		/*.then(function() {
			return view.transition('text2');
		});*/


	},
	showPrompt:function() {
		return this.transition('text2');
	},
	spinWheel:function() {
		if(!this._active) {
			return;
		}
		this._active = false;
		this.trigger('game:spin');
		this.hide();
	},
	hide:function() {
		this.$el.hide();
		this.$('.round-info').empty();
		this.$('.prompt').addClass('hidden');
	}
});
})();
(function() {
Blaze.dna.WaterMeter = Blaze.View.extend({
	className:'water-meter',
	mixins:['hashBinder', 'modelEvents', 'templated', 'transitionable'],
	rowLength:4,
	colLength:10,
	initialize:function() {
		this._level = 40;
		this._tiles = [];
		this.makeGrid();
		this.water = new Howl({
			urls:['audio/WaterLapping_02.wav'],
			loop: true
		});
		this.gurgle = new Howl({
			urls:['audio/gurgle.wav'],
			loop: true
		});
		this._currentlevel = this.getScaledLevel();


	},
	render:function() {
		this.update();
	},
	update:function() {

		var def = Q.defer(),
			n = this.getScaledLevel();

		if(this._currentlevel == n) {
			def.resolve();
			return def.promise;
		}

		this._currentlevel = n;
		this.setLevel(n, def);
		return def.promise;
	},
	makeGrid:function() {
		_.each(_.range(this.rowLength).reverse(), function(r) {
			_.each(_.range(this.colLength), function(c) {
				this.makeTile(c, r);
			}, this);
		}, this);
	},
	makeTile:function(c, r) {
		var dim = 127,
			id = 'wt_'+c+'_'+r,
			tile = $('<div>').attr({
				'class':'water-tile row-'+r,
				'id':id,
				'data-row':r
			}).css({
				top:dim * r,
				left:dim * c
			});

		this._tiles.push(tile);
		this.$el.append(tile);
	},
	setLevel:function(to, def) {
		var up = to > this._level,
			step = up ? 1 : -1,
			self = this,
			rangeUpperBound = _.constrain(to + step, -1, 40),
			range = _.range(this._level, rangeUpperBound, step);

		this.sfx = up ? this.water : this.gurgle;


		var makeSure = setTimeout(function() {
			resolver();
		}, 2500);

		var resolver = function() {
			self.sfx.fade(1.0, 0.0, 200, function() {
				self.sfx.stop();
			});
			def.resolve();
			clearTimeout(makeSure);
		};

		this.sfx.play();
		this.sfx.fade(0.0, 1.0, 500);
		_.each(range, function(n, i) {
			var tile = this._tiles[n];
			if(!tile) {
				resolver();
				return;
			}
			this.animateTile(tile, up, i, i == range.length - 1 ? resolver : null);
		}, this);

		if(_.isEmpty(range)) {
			resolver();
		}


		this._level = to;
	},
	animateTile:function(tile, dir, i, resolver, to) {
		var ani = dir ? 'fadeIn' : 'fadeOut',
			self = this;
		return _.delay(function() {
			tile.removeClass('fadeOut fadeIn').addClass('animated '+ani).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
				if(resolver) {
					resolver();
				}
			});
		}, i * 100);
	},
	getScaledLevel:function() {
		return _.constrain(_.toScale(this.model.get('water'), this.model.get('maxWater'), 40), 0, 40);
	},
	getFinalRowNum:function() {
		if(this._level === 0) {
			return 0;
		}
		if(this._level <= 10) {
			return 1;
		}
		if(this._level <= 20) {
			return 2;
		}
		if(this._level <= 30) {
			return 3;
		}
		return 4;

	}
});
})();
(function() {


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














})();