// handles serializing the suspend strings from an ile model

Blaze.Mixer.add('ileSerializer', {
	// define this in your app to
	serializers:{},
	onModelParsed:function(model) {
		_.each(model.nodes, this._setNodeSerializer, this);
	},
	serialize:function() {

	},
	deserialize:function() {

	},
	getLookup:function() {
		// order of serializer lookup
		// node id
		// profile id
		// activity type
		// template type
		// segment type
		// default
		return _.chain(node.attributes)
				.pick('nodeid', 'sProfile', 'sActivityType', 'sTemplate', 'nodeType')
				.toArray()
				.compact()
				.value()
				.push('all');
	},
	_setNodeSerializer:function() {
		var ser = _.find(this.getLookup() , function(id) {
			return (id) ? (this.serializers[id]) : false;
		}, this);

		node.setSerializer(this.serializers[ser] || []);
	},
	addNodeSerializer:function(id, arr) {
		if(!_.isString(id) || !_.isArray(arr)) {
			return;
		}
		this.serializers[id] = arr;
	}
});