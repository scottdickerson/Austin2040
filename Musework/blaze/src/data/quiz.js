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