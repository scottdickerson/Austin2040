// no triggering of events
var silent = { silent: true };
// this is for enumerated collapsing args into arrays
// looks for arg[n]name
var processPattern = function(p, i) {
	return p.replace('[n]', i);
};
var getPatternReducer = function(m) {
	return function(o, p) {
		o[processPattern(p, '')] = m.get([processPattern(p, o.i)]);
		return o;
	};
};

Blaze.Model = Backbone.Model.extend({
	constructor:function(options) {
		this.mixinBeforeInitialize();

		this.serializer = options && _.isArray(options.serializer) ? options.serializer : [];

		Backbone.Model.apply(this, arguments);
		this.mixinAfterInitialize();
	},
	// these should not be used except in mixins
	mixinBeforeInitialize:function() {},
	mixinAfterInitialize:function() {},
	// takes a  array of patterns and returns a array of objects
	// pattern is like 'sChoice[n]Text'
	// use to get enumerated args
	// very usefull for templating
	collapseArgs: function(pattern, startcount) {
		// pattern must be an array
		if (!_.isArray(pattern)) {
			pattern = [pattern];
		}

		var i = _.isNumber(startcount) ? startcount : 0,
			ret = [],
			attrs = this.attributes,
			allFound = false,
			first = pattern[0],
			reducer = getPatternReducer(this);

		while (!allFound) {
			if (!this.get(processPattern(first, i))) {
				allFound = true;
			} else {
				ret.push(_.reduce(pattern, reducer, {i: i}));
				i++;
			}
		}
		return ret;
	},
	groupForDisplay:function(args, shuffle, uid, baseAttrName) {
		var c = this.collapseArgs(args);

		if(shuffle) {
			c = _.shuffle(c);
		}
		Blaze.utils.addUniqueIds(c, uid);
		Blaze.utils.addNumbering(c);

		if(baseAttrName) {
			_.each(c, function(m) {
				this.set(baseAttrName+m.i+'Id', m.id);
			}, this);
		}
		return c;

	},
	getOr:function(name, v) {
		return this.has(name) ? this.get(name) : v;
	},
	incCounter:function(id, amt) {
		var n = this.get(id);
		if(!n) { n = 0; }
		n = n + (amt || 1);
		this.set(id, n);
		return n;
	},
	decCounter:function(id, amt) {
		var n = this.get(id);
		if(!n) { n = 0; }
		n = n - (amt || 1);
		this.set(id, n);
		return n;
	},
	// seting an array
	setPush:function(id, value, unique) {
		var a = this.get(id);

		if(!a) {
			a = [value];
		}else{
			if(unique === true && _.contains(a, value)) { return; }
			a.push(unique);
		}
		this.set(id, a);
	},
	setShift:function(id) {

	},
	setSerializer:function(serializer) {
		this.serializer = serializer;
	},
	serialize:function() {
		return _.map(this.serializer, function(attr) {
			return this.get(attr);
		}, this);

	},
	deserialize:function(data) {
		if(!this.serializer || !_.isArray(data)) {
			return;
		}
		_.each(this.serializer, function(attr, i) {
			this.set(attr, data[i], {silent:true});
		}, this);
	},
	toString:function() {
		return '(model) ' +(this.id || this.cid);
	}
});
Blaze.Model.extend = Blaze._extend;

Blaze.Collection = Backbone.Collection.extend({
	model:Blaze.Model
});
Blaze.Collection.extend = Blaze._extend;


var _adaptors = {};

var defaultAdaptor = function(node) {
	return _.isFunction(node.toJSON) ? node.toJSON() : node;
};
Blaze.Adaptors = {
	add:function(id, func) {
		_adaptors[id] = func;
	},
	convert:function(id, node, scope) {
		return this.get(id).call(scope, node);
	},
	get:function(id) {
		if(!id) { return defaultAdaptor; }
		return _adaptors[id] || defaultAdaptor;
	}
};
