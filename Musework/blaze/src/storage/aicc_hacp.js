// TODO AICC HACP adaptor
Blaze.Storage.Scorm2004_2Adaptor = Blaze.Storage.Adaptor.extend({
	attemptLimit:7,
	cmiMapping:{

	},
	initialize:function(options) {
		this.id =  options.id || 'aicc_hap';

	}
});