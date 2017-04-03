// TODO AICC edition adaptor
Blaze.Storage.AiccAdaptor = Blaze.Storage.Adaptor.extend({
	attemptLimit:7,
	cmiMapping:{

	},
	initialize:function(options) {
		this.id =  options.id || 'aicc';

	}
});