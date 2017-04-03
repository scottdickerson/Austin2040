// TODO SCORM 2004 2nd edition adaptor
Blaze.Storage.Scorm2004_2Adaptor = Blaze.Storage.Adaptor.extend({
	attemptLimit:7,
	cmiMapping:{

	},
	initialize:function(options) {
		this.id =  options.id || 'scorm_20004_2';

	}
});