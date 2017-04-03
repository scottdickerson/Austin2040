Blaze.Tree = function(config) {
	this.nodes = [];
	this.node_indexes = {};
	this._config(config);
	this.initialize();

};
_.extend(Blaze.Tree.prototype, {
	_config:function() {},
	initialize:function() {},
	onAdded:function(node) {},
	add:function(child, parent) {
		var nodeid, depth = 0, index = 0;
		if(!child) {
			console.error('tried to add null node.');
			return;
		}
		if(parent) {
			depth = parent.get('depth') + 1;
			parent.addNode(child);
		}else if(!this.root) {
			// first node added will be the root, any added after the root will be a unatached node
			child.setIndex(0);
			this.root = child;
		}
		//set depth
		child.setDepth(depth);

		// unique node id is required
		nodeid = child.get('nodeid');
		if(!nodeid) {
			nodeid = _.uniqueId('node_');
			child.set({nodeid:nodeid}, {silent:true});
		}
		if(this.node_indexes[nodeid]) {
			console.error('Duplicate node id: ' + nodeid + 'node not added.');
			return;
		}
		child.tree = this;
		// lookup
		this.node_indexes[nodeid] = this.nodes.push(child) - 1;
		this.onAdded(child);
	},
	get:function(nodeid) {
		return this.nodes[this.node_indexes[nodeid]];
	},
	toString:function() {
		return 'tree ('+this.nodes+')';
	}
});

var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'reduceRight',  'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'max', 'min', 'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'sample'];

//Mix in each Underscore method as a proxy to BlazeTree#models.
_.each(methods, function(method) {
	Blaze.Tree.prototype[method] = function() {
		var args = _.toArray(arguments);
		args.unshift(this.nodes);
		return _[method].apply(_, args);
	};
});

Blaze.Tree.extend = Blaze._extend;

Blaze.regx.forwardSlashes = /\//g;

// abstract base class for Ile tree model
Blaze.TreeNode = Blaze.Model.extend({
	defaults: { nodeType: 'node'},
	// checks the node type
	initialize:function() {
		this.nodes = new Backbone.Collection();

		// make sure we have a unique nodeid
		if(!this.get('nodeid')) {
			this.set('nodeid', _.uniqueId('node'));
		}
	},
	is: function(nodetype) {
		var t = this.get('nodeType');
		if(_.isArray(nodetype)) {
			return _.contains(nodetype, t);
		}
		return t == nodetype;
	},
	count: function(predicate) {
		return _.isFunction(predicate) ? this.nodes.filter(predicate).length :  this.nodes.length;
	},
	// wiring
	setParent: function(parent) {
		this.parent = parent;
	},
	addNode: function(node) {
		node.setParent(this);
		node.setIndex(this.count());
		this.nodes.add(node);
		this.onAdded(node);
	},
	onAdded:function() {},
	getFormatedNodeId:function(del) {
		return this.get('nodeid').replace(Blaze.regx.forwardSlashes , del || '-');
	},
	setIndex:function(n) {
		this.set({ index:n }, silent);
	},
	setDepth:function(n) {
		this.set({ depth: n }, silent);
	},
	at:function(n) {
		return this.nodes.at(n);
	},
	nextSibling:function() {
		return this.parent.at(this.get('index')+1);
	},
	prevSibling:function() {
		return this.parent.at(this.get('index')-1);
	},
/*	getNode: function(id) {
		return this.nodes.get(id);
	}*/

	// traversal methods
	firstChild: function() {
		return this.nodes.at(0);
	},
	lastChild: function() {
		return this.nodes.at(this.nodes.length - 1);
	},
	hasChildren: function() {
		return this.nodes.length > 0;
	},
	getChild: function(id) {
		return this.nodes.get(id);
	},
	findChild: function(func, isChild) {
		if(isChild && func(this)) {
			return this;
		}else{
			var result,
				m = this.nodes.models,
				l = m.length;

			for(var i = 0; i < l; i++) {
				result = m[i].findChild(func, true);
				if(result) {
					return result;
				}
			}
		}
	},
	// TODO get all children that passes test
	findChildren: function(func, a) {
		//console.debug("Find children", this.id, func(this));
		if(!a) {
			a = [];
		}else if(func(this)) {
			a.push(this);
		}
		if(this.nodes.length) {
			this.nodes.each(function(n) {
				n.findChildren(func, a);
			});
		}
		return a;
	},
	// recursive parent finder
	findParent: function(func) {
		if (func(this)) {
			return this;
		}
		if (!this.parent) {
			return null;
		}
		return this.parent.findParent(func);
	},
	// each applied to this node then all children nodes
	each: function(func) {
		func(this);
		this.nodes.each(function(m) {
			m.each(func);
		});
	},
	getChildrenNodeIds: function() {
		return this.nodes.map(function(m) {
			return m.get('nodeid');
		});
	},
	getParents:function() {
		var a = [], found = false, node = this.parent;

		while(node) {
			a.push(node);
			node = node.parent;
		}
		return a;
	},
	// TODO reduce function that goes up in depth
	reduceUp: function(func, val, bThis) {
		var a = this.getParents();
		if(bThis) {
			a.unshift(this);
		}
		return _.reduce(a, func, val);
	},
	mapUp:function(func, bThis) {
		var a = this.getParents();
		if(bThis) { a.unshift(this); }
		return _.map(a, func);
	},
	// TODO reduce funtion down through the children nodes
	reduceDown: function(func) {

	},
	toString:function() {
		return this.get('nodeType') + ':'+this.get('nodeid');
	}
});

Blaze.TreeNode.extend = Blaze._extend;


/*
Blaze.Serializer = function(id, predicate, serialize, deserialize) {
	this.id = id;
	this._predicate = predicate;
	this._serialize = serialize;
	this._deserialize = deserialize;
};

_.extend(Blaze.Serializer.prototype, {
	match:function(node) {
		return this._predicate(node);
	},
	serialize:function(node) {
		return this._serialize(node);
	},
	deserialize:function(node, args) {
		node.set(this._deserialize(args));
	}
});


Blaze.TreeSerializer = function(tree) {
	this.tree = tree;
	this.serializers = [];
};
_.extend(Blaze.TreeSerializer.prototype, {
	prepend:function(serializer) {
		this.serializers.unshift(serializer);
	},
	append:function(serializer) {
		this.serializers.push(serializer);
	},
	make:function(id, predicate, serialize, deserialize, front) {
		var ser = new Blaze.Serializer(id, predicate, serialize, deserialize);
		if(front) {
			this.prepend(ser);
		}else{
			this.append(ser);
		}
		return ser;
	},
	serialize:function() {
		var self = this,
			data = this.tree.map(function(node, a) {
			var ser = self._find(node);
			return (ser) ? ser.serialize(node) : [];
		});

		return JSON.stringify(data);
	},
	_find:function(node) {
		return _.find(this.serializers, function(s) {
			return s.match(node);
		});
	},
	deserialize:function(data) {
		var self = this,
			a = JSON.parse(data);

		if(!_.isArray(a)) {
			console.warn("no date in deserialize data array");
			return;
		}

		this.tree.each(function(s, i) {
			var ser = self._find(node),
				d = a[i];

			if(d) {
				ser.deserialize(d);
			}
		});
	}
});

Blaze.TreeSerializer.extend = Blaze._extend;

*/