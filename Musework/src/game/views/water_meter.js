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