// mixin gradable
//
// requires: class to have a model and templated mixin
// usage:
//
//
Blaze.Mixer.add('gradable', {
	args:{
		answer:'answered',
		outcome:'grade',
		feedbackCorrect:'sCorrectFeedback',
		feedbackIncorrect:'sIncorrectFeedback'
	},
	defaultConfig:{
		bRepeatable:true
	},
	// set a simple feedback adaptor in case we do not have one
	profileReady:function() {
		if(!this.config.sFeedbackAdaptor) {
			this.config.sFeedbackAdaptor = 'SimpleGenericFeedback';
		}
	},
	setEvaluator:function(func) {
		this.evaluator = func;
	},
	// always evaluate as true if no evaluator is set
	grade:function() {
		var b = _.isFunction(this.evaluator) ? this.evaluator(this.model) : true,
			outcome = b ? 'correct':'incorrect';

		//console.log('this.args.grade', this.args.outcome, outcome);
		this.model.set(this.args.outcome, outcome);

		if(b) {
			this.onCorrect();
		}else{
			this.onIncorrect();
		}
		return b;
	},
	isCorrect:function() {
		return this.getArg('grade') == 'correct';
	},
	setAnswered:function(value) {
		this.model.set(this.args.answer, value);
	},
	getAnswered:function() {
		return this.model.get(this.args.answer);
	},
	onIncorrect:function() {},
	onCorrect:function() {},
	renderFeedback:function() {
		var feedback = Blaze.Adaptors.convert(this.config.sFeedbackAdaptor, this.model, this) || {};
		if(this.config.sFeedbackTemplate) {
			this.subTemplate('.js-feedback', this.config.sFeedbackTemplate, feedback);
		}else{  // inline
			this.$('.js-feedback').html(_.isString(feedback) ? feedback : feedback.feedback);
		}

		if(this.hasMixin('transitionable')) {
			this.transitionOr('feedbackIn', function() {
				this.$('.js-feedback').show();
			});
		}else{
			this.$('.js-feedback').show();
		}
	},
	close:function() {
		this.transitionOr('feedbackOut', function() {
			this.$('.js-feedback').hide();
		});
	}
});

//  a simple feedback adaptor
Blaze.Adaptors.add('SimpleGenericFeedback', function(node) {
	return { feedback: this.isCorrect() ? this.getArg('feedbackCorrect') : this.getArg('feedbackIncorrect') };
});