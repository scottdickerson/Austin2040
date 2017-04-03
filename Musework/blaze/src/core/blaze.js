// Blaze name space
var Blaze = {
	dispatcher:_.clone(Backbone.Events),
	// a loader for xml, json, and  html
	// returns a q promise
	loadAsset:function(url, type, callback) {
		var deferred = Q.defer();

		$.ajax({
			url: url,
			dataType: type,
			success: function(asset) {
				if(_.isFunction(callback)) {
					callback(asset);
				}
				Blaze.dispatcher.trigger('asset:loaded', asset, url);
				deferred.resolve(asset);
			},
			error: function(jqxhr, status, err) {
				console.log(jqxhr, status, err);
				Blaze.dispatcher.trigger('load:error', 'url', err);
				deferred.reject(new Error(err));
			}
		});
		return deferred.promise;
	},
	// global storage for reg exs
	// to expose for testing
	regx:{
		stripNonNumeric:/^[0-9]+$/,
		count_:/[^_]/g,
		splitCommaTrim:/\s*,\s*/
	},
	// a namespace for all classes for the application
	dna:{}
};

// add blaze to the global scope
window.Blaze = Blaze;

// add our mixin system to classes this function should not be used directly
Blaze._extend = function(protoProps, classProps) {
	if(this == Blaze) {
		console.error("you cannot extend Blaze in this way");
	}
	var cls = Backbone.Model.extend.call(this, protoProps, classProps);
	var mixins = cls.prototype.mixins;

	// make sure we have a hasMixins function
	if(!cls.prototype.isMixed) {
		Blaze.Mixer.makeMixable(cls);
	}

	if (mixins && cls.prototype.hasOwnProperty('mixins')) {
		Blaze.Mixer.mix(cls, mixins);
	}
	return cls;
};