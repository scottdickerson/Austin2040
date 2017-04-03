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