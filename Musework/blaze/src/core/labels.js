// labels is a key value store for global text
Blaze.dna.LabelCollection = Backbone.Model.extend({
	notifyMissing:true,
	load:function(url) {
		return Blaze.loadAsset(url+'.xml', 'xml', _.bind(this._parse, this));
	},
	_parse:function(xml) {
		this.set(_.reduce(_.getXmlNodes(_.getXmlNodes(xml, 'labels'), 'label'), function(o, lbl) {
			var l = $(lbl);
			o[l.attr('id')] = l.text();
			return o;
		}, {}), silent);
		Blaze.dispatcher.trigger('labels:loaded', this);
	},
	add:function(id, label) {
		var o = {};
		o[id] = label;
		this.set(o, silent);
	},
	get:function(id) {
		var s = Backbone.Model.prototype.get.call(this, id);
		if(!s) {
			return this.notifyMissing ? "Missing Label "+id : '';
		}
		return s;
	}
});
Blaze.Labels =  new Blaze.dna.LabelCollection();