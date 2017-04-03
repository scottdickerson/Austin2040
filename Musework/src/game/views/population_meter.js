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