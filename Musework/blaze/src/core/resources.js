Blaze.Resource = Blaze.Model.extend({

});

Blaze.ResourcesCollection = Backbone.Collection.extend({
	model:Blaze.Resource,
	load:function(url) {
		return Blaze.loadAsset(url+'.xml', 'xml', _.bind(this._parse, this));
	},
	_parse:function(data) {
		console.log("Loaded reources", data);
		var a = [];
		_.each($(data).find('resource'), function(r) {
			var o =_.getXmlAttrs(r);
			if(!o.id || slang.isBlank(o.id)) {
				o.id = _.uniqueId('resources_');
			}
			a.push(o);
		});
		this.add(a);
	}
});

Blaze.Resources = new Blaze.ResourcesCollection();