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
		return  this.chain().filter(function(m) {
			return !m.isUsed();
		}).shuffle().first(cnt || 3).value();
	},
	listUsed:function() {
		return this.chain().filter(function(m) { return m.get('applied'); }).pluck('id').value();
	},
	getMultiplier:function() {
		return this.chain().filter(function(m) {
			return m.get('adjust_water') > 0;
		}).shuffle().first().value();
	}
});