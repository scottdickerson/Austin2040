/*! this is a compiled file do not change blaze.data - v0.1.2 - 2015-03-18 */
(function() {
// create a name space for all of the data stuff
Blaze.Data = {
	NodeTypes:{
		COURSE:"course",
		CHAPTER:"chapter",
		SECTION:"section",
		CLIP:"clip",
		SEGMENT:"segment",
		BRANCH:"branch"
	},
	// utility methods for the ile style model
	branching:{
		isBranchHead: function(id) {
			return id.lastIndexOf('_') == id.length - 1;
		},
		isInBranch: function(id) {
			// top level branch heads are not in branches
			return this.trimBranchHead(id).indexOf('_') != -1;
		},
		getBranchNumber: function(id) {
			// trim off the final underscore if this is a branch head
			id = this.trimBranchHead(id);
			return parseInt(id.substr(id.lastIndexOf('_') + 1, id.length), 10);
		},
		getBranchHeadNodeId: function(id, clipid) {
			id = this.trimBranchHead(id);
			return clipid + '/' + id.substr(0, id.lastIndexOf('_') + 1);
		},
		getBranchNodeId: function(id) {
			return this.getBranchHeadNodeId(id) + 'branch' + this.getBranchNumber(id);
		},
		// removes the last underscore on a branch head
		trimBranchHead: function(id) {
			return this.isBranchHead(id) ? id.substr(0, id.length - 1) : id;
		}
	},
	matchers:{}
};

// add basic type matchers good for iterable functions
// some convience functions
// creates a function used in tree traversal that looks to macth the nodeType attr
var makeTypeFinder = function(s) {
	return function(m) {
		return m.is(s);
	};
};

// TODO: implement robust easily configurable completion tracking scheme
Blaze.Data.CompletionRequirement = function() {

};
_.extend(Blaze.Data.CompletionRequirement.prototype, {

});

Blaze.Data.CompletionManager = function() {

};
_.extend(Blaze.Data.CompletionManager.prototype, {

});

Blaze.Data.Counter = Blaze.Model.extend({
	initialize:function(options) {
		this.id = this.id || this.cid;
	},
	defaults:{
		'count':0,
		'step':1,
		'dir':1
	},
	inc:function(n) {
		this.setCount((n || this.get('step')) * this.get('dir'));

	},
	dec:function(n) {
		this.setCount((n || this.get('step')) * (this.get('dir') * -1));
	},
	saveToModel:function(m) {
		m.set(this.id+"Count", this.get('count'));
	},
	restoreFromModel:function(m) {
		var n = m.get(this.id+"Count");

	},
	setCount:function(n) {
		if(_.isNumber(n)) {
			this.set('count', n);
		}
	}

});

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

Blaze.Quiz = {
	NodeTypes:{
		QUIZ:'quiz'
	}
};
/*
var quizIdentifer = /_?(quiz)/i,
	rubrikIdentifier = /(sFeedback)[0-9]+x[0-9]+/,
	numberGetter = /\d+/g;

Blaze.Quiz.QuizNode = Blaze.TreeNode.extend({
	defaults: {
		nodeType: Blaze.Quiz.NodeTypes.QUIZ,
		nPassScore:60
	},
	isRubriced:function() {
		return !!_.chain(this.attributes).keys().find(function(k) { return rubrikIdentifier.test(k); }).value();
	},
	getFeedback:function(score) {
		var feedback = {};
		if(!_.isNumber(score)) {
			console.error("QuizNode "+this.id+" tried to get feedback without a score");
			return;
		}

		if(this.isRubriced()) {
			feedback = _.reduce(this.attributes, function(o, v, k) {
				if(rubrikIdentifier.test(k)) {
					var key_parts,
						bounds = _.map(k.match(numberGetter), function(n) { return parseInt(n, 10); });


					if(score > bounds[0] && score < bounds[1]) {
						key_parts = k.split("_");
						// sFeedback90-100:"Good Job!" will be on the feedback object as text:"Good Job!"
						o[((!key_parts[1]) ? 'text' : key_parts[1])] = v;
					}
				}
				return o;
			}, {});

			// if we have rubrik feedback return it otherwise default to simple pass fail feed back
			if(!_.isEmpty(feedback)) {
				return feedback;
			}
		}
		// simple pass fail
		return feedback;
	},
	setBank:function(bank) {
		this.bank = bank;
	},
	getBank:function() {
		return this.bank;
	},
	hasBank:function() {
		return (this.bank);
	}
});
*/

Blaze.QuizNode = Blaze.TreeNode.extend({
	mixins:['hashBinder', 'globalEvents', 'configurable'],
	defaultConfig:{
		nPointValue:100,
		bBanked:false,
		bGrouped:false,
		nBankSize:5
	},
	defaults: {
		nodeType:Blaze.Quiz.NodeTypes.QUIZ
	},
	initialize:function() {
		this.nodes = [];
		this.getBlazeConfig(this.get('nodeid'));

		this.triggerGlobal('quiz:created', this);
	},
	addActivity:function(node) {
		this.nodes.push(node);

		node.set({
			inQuiz:true,
			quizId:this.get('nodeid'),
			questionId:_.uniqueId('q')
		});

		node.on('change:grade', this.onQuestionGraded, this);

		node.quiz = this;
	},
	onQuestionGraded:function(m) {
		this.triggerGlobal('quiz:answered', m, this);
	},
	getGroupedNodes:function() {
		return _.groupBy(this.nodes, function(m) {
			return m.get('nGroup');
		});
	},
	getFailedGroupNumbers:function() {
		var groups = this.getGroupedNodes();
		var a = [];
		_.each(groups, function(g, n) {
			if(!_.all(g, this.isCorrect)) { a.push(n); }
		}, this);
		return a;
	},
	isCorrect:function(node) {
		return node.get('grade') == 'correct';
	},
	grade:function() {
		var total = this.nodes.length;
		var count = this.getCorrectCount();

	},
	isComplete:function() {
		return _.every(this.nodes, function(m) {
			return (m.get('grade'));
		});
	},
	getCorrectCount:function() {
		var count = _.countBy(this.nodes, function(node) {
			return node.get('grade');
		});
		if(!count.correct) { count.correct = 0; }
		if(!count.incorrect) { count.incorrect = 0; }
		count.total = this.nodes.length;

		return count;
	},
	getScore:function() {
		var total = this.nodes.length;
		var count = this.getCorrectCount();

		return Math.round((count.correct / total) * 100);
	},
	isAllCorrect:function() {
		var count = this.getCorrectCount();

		return count.total !== 0 && count.total == count.correct;
	}
});


Blaze.Mixer.add('quizzed',  {
	args:{
		quiz:'nQuiz',
		activity:'sActivityType'
	},
	mixinBeforeInitialize:function() {
		this.quizzes = {};
	},
	onModelParsed:function(model) {
		this.model = model;
		_.each(this.getQuizActivityNodes(model.nodes), this.addActivityToQuiz, this);
	},
	getQuizActivityNodes:function(nodes) {
		return _.filter(nodes, function (node) {
			return (node.get(this.args.quiz)) && node.has(this.args.activity);
		}, this);
	},
	addActivityToQuiz:function(node) {
		var quiz, n = node.get('nQuiz');
		this.getQuiz(n, true).addActivity(node);
	},
	createQuiz:function(n) {
		var id = 'quiz_'+n;
		var qn = new Blaze.QuizNode({ nodeid:id });
		this.quizzes[id] = qn;
		this.model.add(qn);
		return qn;
	},
	getQuiz:function(n, create) {
		var q = this.quizzes['quiz_'+n];
		if(!q && create) {
			q = this.createQuiz(n);
		}
		return q;
	}
});

// TODO timer model
Blaze.Data.Timer = Blaze.Model.extend({

});
})();