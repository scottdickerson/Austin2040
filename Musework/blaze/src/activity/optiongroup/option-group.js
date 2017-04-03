Blaze.dna.OptionGroup =  Blaze.View.extend({
	className:'activity-option-group',
	mixins:[
		'hashBinder',
		'globalEvents',
		'templated',
		'configurable',
		'statefull',
		'gradable',
		'activity',
		'toggleEnabled',
		'attempts',
		'shortcuts',
		'transitionable'
	],
	events:{
		'click .js-close':'close',
		'click .js-next':'next',
		'click .js-choice':'choose',
		'click .js-submit':'submit',
		'click .js-try':'tryAgian'
	},
	args:{
		correct:'sCorrectChoices',
		feedbackAll:'sFeedbackAll',
		feedbackCorrect:'sCorrectFeedback',
		feedbackIncorrect:'sIncorrectFeedback',
		feedbackLast:'sLastFeedback'
	},
	defaultConfig:{
		bShuffle:true,
		aGroupArgs:['sGroup[n]'],
		aChoiceArgs:['sChoice[n]', 'sChoice[n]Text'],
		sTemplate:"OptionGroup",
		sAlert:null,
		bRevealAnswers:true,
		bSubmitNone:false,
		sFeedbackType:'general', // general specific or none
		sFeedbackTemplate:null,
		sAdaptor:'OptionGroup',
		sFeedbackAdaptor:'OptionGroupFeedback',
		bModal:false
	},
	// called by configurable mixin after configs have been set
	profileReady:function() {
		_.bindAll(this, 'resetChoices');
		this.choices = this.model.groupForDisplay(this.config.aChoiceArgs, this.config.bShuffle, 'choice_', 'sChoice');
		this.groups = this.model.collapseArgs(this.config.aGroupArgs);

		// add group id to choices
		_.each(this.choices, function(c) {
			c.groupID = this.getGroup(c.sChoice).i;
		}, this);

		this.answered = [];
	},
	states:{
		ready:{ // no selections made - can select - cannot submit
			enter:function(prevState) {
				if(prevState != "active") {
					this.$('.js-choice').addClass('unselected');
				}
				this.enable();
			}
		},
		active:{ // selections made - can select - can submit
			enter:function() {
				this.enable();
			}
		},
		feedback:{
			enter:function() {
				this.disable();
				this.markChoices();
				this.renderFeedback();
				this.markCompleted();
			}
		},
		review:{
			enter:function() {}
		},
		pause:{
			enter:function() {
				this.disable();
				this.renderFeedback();

				// if feedback is inline
				// go ahead and resetChoicesChoices (changes state back to ready)

				console.log('this.config.bModal', this.config.bModal);
				if(!this.config.bModal) {
					this.resetChoices();
				}

			}
		}
	},
	render:function() {
		// temp make sure we clear the answered if we are replaying
		// need to think more about how this works
		this.answered = [];
		this.template(this.getTemplateIdOr(), this.getTemplateData(this.config.sAdaptor));
		// determine start state
		// if reviewable init in review mode
		// else just set active
		//
		this.state('ready');
		this.mixinAfterRender();
	},
	getGroupChoices:function(sChoice) {
		var group = this.getGroup(sChoice);
		var sChoices = group.sGroup.split(",");
		return sChoices;
	},
	choose:function(e) {
		this.setChoice($(e.currentTarget).attr('id'));
		e.preventDefault();
	},
	setChoice:function(id) {
		var choice = this.getChoiceByElementId(id),
			el =this.$('#'+choice.id),
			isSelected = el.hasClass('selected'),
			that = this;

		var sChoices = this.getGroupChoices(choice.sChoice);

		// clear group
		$('.group-'+choice.groupID).removeClass('selected').addClass('unselected');
		_.each(sChoices, function(c) {
			that.removeAnswered(c);
		});

		// set selected
		this.setAnswered(choice.sChoice);
		el.removeClass('unselected').addClass('selected');

		this.state((this.canSubmit() ? 'active' : 'ready'));
	},
	setAnswered:function(val) {
		if(!_.contains(this.answered, val)) {
			this.answered.push(val);
		}
	},
	removeAnswered:function(val) {
		if(_.contains(this.answered, val)) {
			this.answered = _.without(this.answered, val);
		}
	},
	getChoice:function(id) {
		return _.findWhere(this.choices, {sChoice:id});
	},
	getGroup:function(sChoice) {
		return _.find(this.groups, function(g) { return g.sGroup.indexOf(sChoice) >= 0; });
	},
	getChoiceByElementId:function(id) {
		return _.findWhere(this.choices, {id:id});
	},
	onDisabled:function() {
		this.removeShortcuts();
	},
	onEnabled:function() {
		if(this.canShortcut) {
			//this.addShortcuts();
		}
	},
	canSubmit:function() {
		console.log('answers: ' + this.answered);
		return this.config.bSubmitNone || this.$('.js-choice.selected').length === this.groups.length;
	},
	submit:function() {
		if(!this.canSubmit()) { return; }

		this.grade();
		this.setAttempted();

		// if we are not giving feedback just call next
		if(this.config.sFeedbackType == 'none') {
			this.next();
			return;
		}

		// allow another try or show feedback
		if(this.isCorrect() || !this.canAttempt()) {
			this.state('feedback');
		}else{
			this.state('pause');
		}
	},
	// are the arrays equal?
	evaluator:function(model) {
		var a = this.answered,
			b = this.getArg('correct') || '';

			console.log('answered:',  a.sort());
			console.log('correct:', b.split(Blaze.regx.splitCommaTrim).sort());

		return _.isEqual(a.sort(), b.split(Blaze.regx.splitCommaTrim).sort());
	},
	// add a correct or incorrect class to all choices
	// usefull for styling
	markChoices:function() {
		var correct = this.getArg('correct');

		if(!correct || correct === "") {
			correct = [];
		}else{
			correct = correct.split(Blaze.regx.splitCommaTrim);
		}

		_.each(this.choices, function(c) {
			this.$("#"+c.id).addClass(_.contains(correct, c.sChoice) ? 'correct' : 'incorrect');
		}, this);
	},
	clearSelected:function() {
		this.$('.selected').removeClass('selected').addClass('unselected');
	},
	canShortcut:function() {
		return (this.config.bShortcuts && this.choices && !this.hasShortcuts());
	},
	resetChoices:function() {
		this.$('.js-choice').removeClass('selected').addClass('unselected');
		this.answered = [];
		this.state('ready');

		console.log('should be ready!', this.state());
	},
	next:function() {
		this.triggerGlobal('command:run', 'next');
	},
	tryAgian:function() {
		this.transitionOr('feedbackOut', function() {
			this.$('.js-feedback').hide();
		}).then(this.resetChoices);
	}
});


Blaze.Adaptors.add('OptionGroup', function(node) {
	var m = node.toJSON();
	m.choices =	this.choices;
	return m;
});
// adaptor for getting feedback
// done this way so we can easily introduce new feedback schemes
Blaze.Adaptors.add('OptionGroupFeedback', function(node) {
	var correct = this.isCorrect(),
		attempt = this.canAttempt();
		fb = {
			isCorrect:correct,
			canAttempt:(attempt && !correct)
		};

	log('OPTION GROUP FEEDBACK '+this.isCorrect());

	switch(this.config.sFeedbackType) {
		case 'general':
			fb.feedback = this.getArg('feedback' +  (correct ? 'Correct' : 'Incorrect'));
			break;
		case 'specific':
			break;
	}

	if(!fb.feedback && this.getArg('feedbackLast')) {
		fb.feedback = this.getArg('feedbackLast');
	}

	console.log('fb', fb);
	return fb;
});
