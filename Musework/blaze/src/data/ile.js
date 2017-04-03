// TODO: move parsing and loading out of the IleModel class
_.each(Blaze.Data.NodeTypes, function(v, k) {
	Blaze.Data.matchers[v] = makeTypeFinder(v);
});

Blaze.Data.CourseNode = Blaze.TreeNode.extend({
	defaults: {
		nodeType: Blaze.Data.NodeTypes.COURSE,
		id: Blaze.Data.NodeTypes.COURSE,
		nodeid: Blaze.Data.NodeTypes.COURSE
	}
});

Blaze.Data.ChapterNode = Blaze.TreeNode.extend({
	defaults: { nodeType: Blaze.Data.NodeTypes.CHAPTER }
});
Blaze.Data.SectionNode = Blaze.TreeNode.extend({
	defaults: { nodeType: Blaze.Data.NodeTypes.SECTION }
});
Blaze.Data.ClipNode = Blaze.TreeNode.extend({
	defaults: { nodeType: Blaze.Data.NodeTypes.CLIP }
});
Blaze.Data.SegmentNode = Blaze.TreeNode.extend({
	defaults: { nodeType: Blaze.Data.NodeTypes.SEGMENT }
});
Blaze.Data.BranchNode = Blaze.TreeNode.extend({
	defaults: { nodeType: Blaze.Data.NodeTypes.BRANCH }
});
// customization hook
// a mapping of classes for each node
Blaze.Data.NodeMapping = {
	course: Blaze.Data.CourseNode,
	chapter:Blaze.Data.ChapterNode,
	section:Blaze.Data.SectionNode,
	clip:   Blaze.Data.ClipNode,
	segment:Blaze.Data.SegmentNode,
	branch: Blaze.Data.BranchNode
};

var silent = {silent:true};


// TODO allow for url masking for node lookup, not really sure about this
Blaze.Data.IleModel = Blaze.Tree.extend({
	serializers:{
		all:['complete'] // you can override this default
	},
	// these args will be added to all nodes
	nodeDefaults:{},
	// defines what parsers are to be used for each piece of data
	// customization hook
	parsers:{
		chapters:'chapters',
		sections:'sections',
		clips:'clips',
		segs:'segs',
		seg:['data', 'branch', 'branching', 'seg'],
		branch:'branch'
	},
	// allows for finding nodes by nodetypes
	create:function(type, attrs, parent) {
		var cls = Blaze.Data.NodeMapping[type] || Blaze.TreeNode,
			node = new cls(attrs);

		Blaze.dispatcher.trigger('node:create', node, parent);
		return this.add(node, parent);
	},
	add:function(child, parent) {
		child.set(this.nodeDefaults, silent);
		this.setNodeSerializer(child); // add serialization
		Blaze.Tree.prototype.add.apply(this, _.toArray(arguments));
		Blaze.dispatcher.trigger('node:add', child, parent);
		return child;
	},
	load:function(url) {
		var cb = _.bind(this.parse, this);
		return Blaze.loadAsset(url+'.xml', 'xml', cb);
	},
	// it is all in the parse :)
	parse:function(xml) {
		var nodes = _.getXmlNodes(xml, 'chapters > chapter'),
			root = this.create(Blaze.Data.NodeTypes.COURSE);

		Blaze.Parsers.parse(this.parsers.chapters, true, this, nodes, root);
		Blaze.dispatcher.trigger('iledata:loaded', this);
	},
	serialize:function() {
		var a = _.map(this.nodes, function(m) {
			return m.serialize();
		});
		return JSON.stringify(a);
	},
	deserialize:function(data) {
		if(!data) { return; }
		var a = JSON.parse(data);

		if(a.length != this.nodes.length) {
			// corrupted suspend or structure changes
			Blaze.dispatcher.trigger('iledata:error', 'suspend length does not match nodes length');
			return;
		}

		_.each(a, function(d, i) {
			if(!_.isArray(d)) { return; }
			this.nodes[i].deserialize(d);
		}, this);

		Blaze.dispatcher.trigger('iledata:restored', this);
	},
	setNodeSerializer:function(node) {
		// order of serializer lookup
		// profile id
		// activity type
		// segment type
		// default
		var ser = _.find([
			node.get('nodeid'),
			node.get('sProfile'),
			node.get('sActivityType'),
			node.get('nodeType'),
			'all'
		], function(id) {
			return (id) ? (this.serializers[id]) : false;
		}, this);

		node.setSerializer(this.serializers[ser] || []);
	},
	addNodeSerializer:function(id, arr) {
		this.serializers[id] = arr;
	},
	toString:function() {
		return 'ile model ['+this.nodes.join(", ")+']';
	}
});

// add defualt parsers
// always matches
Blaze.Parsers.add('chapters', null, function(tree, nodes, root) {
	var chapter, args;

	_.each(nodes, function(data) {
		args =  _.getXmlAttrs(data, ['id', 'title']);
		args.nodeid = args.id;
		chapter = tree.create(Blaze.Data.NodeTypes.CHAPTER, args, root);
		Blaze.Parsers.parse(tree.parsers.sections, true, tree, _.getXmlNodes(data, 'section'), chapter);
	});
});

// always matches
Blaze.Parsers.add('sections', null, function(tree, nodes, chapter) {
	var section, args,
	chapid = chapter.get('nodeid');

	_.each(nodes, function(data) {
		args = _.getXmlAttrs(data, ['id', 'title']);
		args.nodeid = chapid + '/' + args.id;
		section = tree.create(Blaze.Data.NodeTypes.SECTION, args,  chapter);

		Blaze.Parsers.parse(tree.parsers.clips, true, tree, _.getXmlNodes(data, 'clip'), section);
	});
});

// always matches
Blaze.Parsers.add('clips', null, function(tree, nodes, section) {
	var clip, args,
	sectionid = section.get('nodeid');

	_.each(nodes, function(data) {
		args = _.getXmlAttrs(data, ['id', 'title']);
		args.nodeid = sectionid + '/' + args.id;
		clip = tree.create(Blaze.Data.NodeTypes.CLIP, args,  section);
		Blaze.Parsers.parse(tree.parsers.segs, true, tree, _.getXmlNodes(data, 'seg'), clip);
	});
});

// always matches
Blaze.Parsers.add('segs', null, function(tree, nodes, clip) {
	var id, args;
	_.each(nodes, function(data) {
		var id = _.getXmlAttrs(data, ['id']).id,
			args = _.getXmlAttrs($(data).find('args').first().get(0));

		args.id = id;
		Blaze.Parsers.parse(tree.parsers.seg, args, tree, args, clip);
	});
});

// allow args for sequences ['course','chapter','section','clip'] to be passed on a segment
// should match segment id course
//

Blaze.Parsers.add('data', function(args) {
	return _.contains(['course','chapter','section','clip'], args.id);
}, function(tree, args, clip) {
	var node = clip.findParent(function(n) {
		n.is(args.id);
	});
	if(node) {
		node.set(args, silent);
	}
});

//  should match segment id labels
//  allows labels to be in the doc
Blaze.Parsers.add('label_data', {id:'labels'}, function(tree, args, clip) {
	Blaze.dispatcher.trigger('labels:add', args);
});

//
// explicit branch creation
Blaze.Parsers.add('branch', {id:'branch'},
	function(tree, args, clip) {

		var id = args.id,
		clipid = clip.get('nodeid'),
		headid = clip.get('nodeid') + '/'+ args.sParentSeg,
		head = tree.get(headid),
		branchid = '_branch'+args.nBranch,
		branch_nodeid = headid + branchid;



	if(!head) {
		console.error('missing branch head', headid);
		return;
	}

	args.id = branchid;
	args.nodeid = branch_nodeid;

	console.log("explict branch creation", branchid, args);
	return tree.create(Blaze.Data.NodeTypes.BRANCH, args, head);

});
Blaze.Parsers.add('branching', function(args) {
	return _.isNumber(args.nBranch);
}, function(tree, args, clip) {
	var id = args.id,
		clipid = clip.get('nodeid'),
		headid = clip.get('nodeid') + '/'+ args.sParentSeg,
		head = tree.get(headid),
		branchid = '_branch'+args.nBranch,
		branch_nodeid = headid + branchid,
		branch = tree.get(branch_nodeid);

	if(!head) {
		console.error('missing branch head', headid);
		return;
	}

	if(!branch) {
		branch = tree.create(Blaze.Data.NodeTypes.BRANCH, {
			id:branchid,
			nodeid:branch_nodeid
		}, head);
	}
	args.nodeid = clipid + '/' + args.id;
	args.inBranch = true;
	args.branchHead = headid;
	return tree.create(Blaze.Data.NodeTypes.SEGMENT, args, branch);
});


// default normal segment
// always matches
Blaze.Parsers.add('seg', null, function(tree, args, clip) {
	// make sure we have a node id
	if(!args.nodeid) {
		args.nodeid = clip.get('nodeid') + '/' + args.id;
	}
	return tree.create(Blaze.Data.NodeTypes.SEGMENT, args, clip);
});





/* ILE Model application mixin */

Blaze.Mixer.add('ileModel', {
	mixinBeforeInitialize:function(options) {
		_.bindAll(this, 'loadModel', '_onModelParsed');

		var model = new Blaze.Data.IleModel();

		_.each(this.serializers, function(a, id) {
			if(_.isArray(a)) {
				model.addNodeSerializer(id, a);
			}

		});

		this.model = model;
		this.onModelInit(model);

		this.modelPath = options.dataPath || 'full-struct';
	},
	// hook for application
	// use to set serializers
	onModelInit:function() {},
	onModelParsed:function() {},
	_onModelParsed:function() {
		this.onModelParsed(this.model);
	},
	serializers:{}, // use this to set distinct serializers

	// node mapping can be overridden to allow custom(extended) model classes
	nodeMapping:{
		course: Blaze.Data.CourseNode,
		chapter:Blaze.Data.ChapterNode,
		section:Blaze.Data.SectionNode,
		clip:   Blaze.Data.ClipNode,
		segment:Blaze.Data.SegmentNode,
		branch: Blaze.Data.BranchNode
	},
	loadModel:function(path) {
		return this.model.load(this.modelPath).then(this._onModelParsed);
	},
	getFirstSegment:function() {
		return this.model.root.findChild( Blaze.Data.matchers.segment );
	},
	getFirstSegmentId:function() {
		var node = this.getFirstSegment();
		return (node) ? node.get('nodeid') : null;
	},
	getRoot:function() {
		return this.model.root;
	},
	getNode:function(nodeid) {
		return this.model.get(nodeid);
	},
	createNode:function() {

	},
	setRootData:function() {
		this.model.root.set.apply(this.model.root, _.toArray(arguments));
	},
	getRootData:function(attr) {
		return this.model.root.get(attr);
	},
	getSaveData:function() {
		return this.model.serialize();
	},
	setSaveData:function(bookmark) {
		if(_.isString(bookmark)) {
			this.model.deserialize(bookmark);
		}
	}
});