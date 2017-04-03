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