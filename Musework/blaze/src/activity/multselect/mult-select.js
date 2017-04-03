Blaze.dna.MultSelect =  Blaze.View.extend({
	className:'activity-mult-select',
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
		feedbackLast:'sLastFeedback',
		maxSelected:'nMaxSelected'
	},
	defaultConfig:{
		bShuffle:true,
		aChoiceArgs:['sChoice[n]', 'sChoice[n]Text'],
		sTemplate:"MultSelect",
		sAlert:null,
		bRevealAnswers:true,
		bSubmitNone:false,
		sFeedbackType:'general', // general specific or none
		sFeedbackTemplate:null,
		sAdaptor:'MultSelect',
		sFeedbackAdaptor:'MultSelectFeedback',
		bModal:false
	},
	// called by configurable mixin after configs have been set
	profileReady:function() {
		_.bindAll(this, 'resetChoices');
		this.choices = this.model.groupForDisplay(this.config.aChoiceArgs, this.config.bShuffle, 'choice_', 'sChoice');
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
		this.model.set('answered', null);
		this.template(this.getTemplateIdOr(), this.getTemplateData(this.config.sAdaptor));
		// determine start state
		// if reviewable init in review mode
		// else just set active
		//
		this.state('ready');
		this.mixinAfterRender();
	},
	choose:function(e) {
		this.toggleChoice($(e.currentTarget).attr('id'));
		e.preventDefault();
	},

	toggleChoice:function(id) {
		if(!this.isEnabled()) { return; }
		var choice = this.getChoiceByElementId(id),
			el =this.$('#'+choice.id),
			isSelected = el.hasClass('selected'),
			maxSelected = parseInt(this.getArg('maxSelected'));

		if(!isSelected && _.isNumber(maxSelected) && this.getSelectedCount() >= maxSelected) {
			return;
		}

		this.toggleAnswered(choice.sChoice);

		el.toggleClass('selected', !isSelected).toggleClass('unselected', isSelected);
		this.state((this.canSubmit() ? 'active' : 'ready'));
	},
	getSelectedCount:function() {
		var a = this.model.get('answered');
		return a ? a.length : 0;
	},
	toggleAnswered:function(val) {
		var a = this.model.get('answered') || [];
		if(_.contains(a, val)) {
			a = _.without(a, val);
		}else{
			a.push(val);
		}
		this.model.set('answered', a);
	},
	getChoice:function(id) {
		return _.findWhere(this.choices, {sChoice:id});
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
		return this.config.bSubmitNone || this.$('.js-choice.selected').length > 0;
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
		var a = this.model.get('answered') || [],
			b = this.getArg('correct') || '';

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
		this.model.set('answered', null);
		this.state('ready');

		console.log('should be ready!', this.state());
	},
	next:function() {
		this.triggerGlobal('command:run', 'next');
	},
	tryAgian:function() {
		this.transitionOr('feedbackOut', function() {
			console.log('HIDE Feedback');
			this.$('.js-feedback').hide();
		}).then(this.resetChoices);
	}
});


Blaze.Adaptors.add('MultSelect', function(node) {
	var m = node.toJSON();
	m.choices =	this.choices;
	return m;
});
// adaptor for getting feedback
// done this way so we can easily introduce new feedback schemes
Blaze.Adaptors.add('MultSelectFeedback', function(node) {
	var correct = this.isCorrect(),
		attempt = this.canAttempt();
		fb = {
			isCorrect:correct,
			canAttempt:(attempt && !correct)
		};

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
