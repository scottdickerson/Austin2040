Blaze.Mixer.add('assetLoader', {
	assets:{

	},
	mixinAfterInitialize:function(options) {
		if(options.assets) {
			this.assets = options.assets;
		}
		return options;
	},
	loadAssets:function() {
		var a = [];

		_.each(this.assets.configs, function(url) {
			a.push(Blaze.Configs.load(url));
		});

		_.each(this.assets.labels, function(url) {
			a.push(Blaze.Labels.load(url));
		});

		_.each(this.assets.templates, function(url) {
			a.push(Blaze.Templates.load(url));
		});

		_.each(this.assets.resources, function(url) {
			a.push(Blaze.Resources.load(url));
		});

		return Q.all(a).fail(this.onAssetLoadError);
	},
	// call this in the fail call of the intialization
	onAssetLoadError:function(error) {
		console.error(error, error.stack);
	}
});
