// Mult Choice interactivity
Blaze.dna.MultChoice = Blaze.View.extend({
	className:'activity-mult-choice',
	mixins:[
		'hashBinder',
		'globalEvents',
		'templated',
		'configurable',
		'commandable',
		'statefull',
		'activity',
		'gradable',
		'toggleEnabled',
		'attempts',
		'shortcuts',
		'transitionable',
		'timed'
	],
	args:{
		correct:'sCorrectChoice',
		feedbackAll:'sFeedbackAll',
		feedbackCorrect:'sCorrectFeedback',
		feedbackIncorrect:'sIncorrectFeedback',
		feedbackLast:'sLastFeedback'
	},
	events:{
		'click .js-close':'close',
		'click .js-next':'next',
		'click .js-choice':'choose',
		'click .js-submit':'submit',
		'click .js-try':'tryAgian'
	},
	// this will be overridden by formatted id (unique to seg), sTemplate in args, sTemplate in config config
	templateId:'MultChoice',
	defaultConfig:{
		aChoiceArgs:['sChoice[n]', 'sChoice[n]Text'], // this is a pattern for building the choices array data for the template
		bShuffle:true, // should choices be shuffled
		bAutoSubmit:false,// bypass submit button when user selects
		sTemplate:'MultChoice', // the template to load from Blaze.Templates
		bHideSubmit:false, // TODO: usefull for using multile activities
		bShortcuts:false, // allow for keyboard selection and submiting uses 1,2,3... or a,b,c... depends on sShortcutType
		sShortcutType:'numeric', // alpha or numeric determines if choices use letter or numbers
		sFeedbackType:'general', // general specific or none
		sFeedbackTemplate:null,
		sAdaptor:'MultChoice',
		sFeedbackAdaptor:'MultChoiceFeedback',
		bModal:false
	},
	profileReady:function() {
		_.bindAll(this, 'resetChoices');
		this.choices = this.model.groupForDisplay(this.config.aChoiceArgs, this.config.bShuffle, 'choice_', 'sChoice');
	},
	states:{
		ready:{ // no selections made - can select - cannot submit
			enter:function() {
				this.$('.js-choice').addClass('unselected');
				this.enable();
				// only runs if bCountdown is set to true in config
				this.startCountdown();
			}
		},
		active:{ // choice made - can select - can submit
			enter:function() {
				this.enable();
			}
		},
		// use this for a try agian feedback
		// submited - cannot select - cannot submit
		pause:{
			enter:function() {
				this.disable();
				this.renderFeedback();

				// if feedback is inline
				// go ahead and resetChoices (changes state back to ready)
				if(!this.config.bModal) {
					this.resetChoices();
				}
			}
		},
		feedback:{ // sumited - cannot select - cannot submit
			enter:function() {
				this.disable();
				this.markChoices();
				this.renderFeedback();
				this.markCompleted();
			}
		},
		review:{ // just restored cannot select cannot submit
			enter:function() {
				this.disable();
				this.setChoice(this.getAnswered());
				this.markChoices();
			}
		}
	},
	render:function() {
		this.template(this.getTemplateIdOr(), this.getTemplateData(this.config.sAdaptor));
		// determine start state
		// if reviewable init in review mode
		// else just set ready
		if(this.isCompleted() && !this.config.bRepeatable) {
			this.state('review');
		}else{
			this.markStarted();
			this.state('ready');
		}
		this.mixinAfterRender();
	},
	submit:function() {
		if(this.config.sFeedbackType == 'branching') {
			// TODO:
			// get branch from model
			// then triger node:request
			return;
		}
		var correct = this.grade();
		this.setAttempted(this.getAnswered());

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

	evaluator:function(model) {
		var a = this.getAnswered(),
			b = this.getArg('correct');

		return !_.isUndefined(a) && _.isEqual(a, b);
	},
	choose:function(e) {
		this.setChoice($(e.currentTarget).attr('id'));
		e.preventDefault();
	},
	setChoice:function(choiceId) {

		// check to
		if(!this.isEnabled()) { return; }
		var choice = this.getChoiceByElementId(choiceId);

		if(!choice) { return; }

		this.clearSelected();
		this.setSelected(choice.id);
		this.setAnswered(choice.sChoice);

		this.state('active');
		if(this.config.bAutoSubmit) {
			this.submit();
		}
	},
	clearSelected:function() {
		this.$('.selected').removeClass('selected').addClass('unselected');
	},
	setSelected:function(id) {
		this.$("#"+id).addClass('selected').removeClass('unselected');
	},
	getChoice:function(id) {
		return _.findWhere(this.choices, {sChoice:id});
	},
	getChoiceByElementId:function(id) {
		return _.findWhere(this.choices, {id:id});
	},
	getChoiceNum:function() {
		var c = _.findWhere(this.choices, {'sChoice':this.getAnswered()});
		if(c) { return c.i; }
	},
	onDisabled:function() {
		this.removeShortcuts();
	},
	onEnabled:function() {
		if(this.canShortcut) {
			this.addShortcuts();
		}
	},
	canShortcut:function() {
		return (this.config.bShortcuts && this.choices && !this.hasShortcuts());
	},
	addShortcuts:function() {
		var self = this,
			key = this.config.sShortcutType == "alpha" ? 'letter' : 'num';

		_.each(this.choices, function(c) {
			self.addShortcut(c[key].toString(), function() {
				self.setChoice(c.sChoice);
			});
		});
		this.addShortcut('enter', function() {
			var focused = $($("*:focus")[0]);
			if(!focused.hasClass('js-choice') || focused.hasClass('selected')) {
				self.submit();
			}
		});
	},
	// add a correct or incorrect class to all choices
	// usefull for styling
	markChoices:function() {
		var correct = this.getArg('correct');

		_.each(this.choices, function(c) {
			this.$("#"+c.id).addClass(correct == c.sChoice ? 'correct':'incorrect');
		}, this);
	},
	resetChoices:function() {
		this.$('.js-choice').removeClass('selected').addClass('unselected');
		this.model.set('answered', null);
		this.resetCountdown();
		this.state('ready');
	},
	tryAgian:function() {
		this.transitionOr('feedbackOut', function() {
			this.$('.js-feedback').hide();
		}).then(this.resetChoices);
	}
});

Blaze.Adaptors.add('MultChoice', function(node) {
	var m = this.model.toJSON();
	m.choices =	this.choices;
	return m;
});

// adaptor for getting feedback
// done this way so we can easily introduce new feedback schemes
Blaze.Adaptors.add('MultChoiceFeedback', function(node) {
	var correct = this.isCorrect(),
		attempt = this.canAttempt(),
		n = this.getChoiceNum(),
		fb = {
			isCorrect:correct,
			nChoosen:n,
			canAttempt:(attempt && !correct)
		};

	switch(this.config.sFeedbackType) {
		case 'general':
			fb.feedback = this.getArg('feedback' +  (correct ? 'Correct' : 'Incorrect'));
			break;
		case 'specific':
			fb.feedback = this.model.get('sChoice'+n+'Feedback');
			break;
	}

	if(!correct && !attempt && this.getArg('feedbackLast')) {
		fb.feedback = this.getArg('feedbackLast');
	}
	//console.log('fb', fb);
	return fb;
});
