// sort list activity (requires jquery-ui)

Blaze.dna.SortList = Blaze.View.extend({
	className:'sort-list',
	templateId:'SortList',
	mixins:[
		'hashBinder',
		'globalEvents',
		'templated',
		'configurable',
		'commandable',
		'statefull',
		'gradable',
		'toggleEnabled',
		'attempts',
		'transitionable'
	],
	defaultConfig:{
		sDraggerArgs:['sDragger[n]', 'sDragger[n]Text'],
		sAdaptor:'ListSort',
		bShuffle:true,
		sFeedbackType:'general', // general specific or none
		sFeedbackTemplate:null,
	},
	args:{
		order:'sDraggerOrder',
		feedbackCorrect:'sCorrectFeedback',
		feedbackIncorrect:'sIncorrectFeedback',
		feedbackLast:'sLastFeedback'
	},
	events:{
		'click .js-submit':'submit'
	},
	states:{
		active:{ // no selections made - can select - cannot submit
			enter:function() {
				this.$('.js-list').sortable({
					containment:this.$('.js-dragarea'),
					revert: true
				}).disableSelection();
				this.enable();
			}
		},
		feedback:{
			enter:function() {
				this.disable();
				var feedback = this.getFeedback();

				if(this.config.sFeedbackTemplate) {
					this.subTemplate('.js-feedback', this.config.sFeedbackTemplate,  {
						isCorrect:this.isCorrect(),
						feedback:feedback,
						order:this.getCurrentOrder().join()
					});
				}else{  // inline
					this.$('.js-feedback').html(feedback);
				}
			}
		}
	},
	profileReady:function() {
		this.draggers = this.model.groupForDisplay(this.config.sDraggerArgs, this.config.bShuffle, 'item_', 'sItem');
	},
	render:function() {
		this.template(this.getTemplateIdOr(), this.getTemplateData(this.config.sAdaptor));
		// determine start state
		// if reviewable init in review mode
		// else just set active
		//


		this.state('active');
		this.mixinAfterRender();
	},
	evaluator:function() {
		return _.isEqual(this.getCurrentOrder(), this.getArg('order').split(Blaze.regx.splitCommaTrim));
	},
	getCurrentOrder:function() {
		return _.map(this.$('.js-list').children(), function(el) {
			var item = this.getItemByElementId($(el).attr('id'));
			return (item) ? item.sItem : null;
		}, this);
	},
	getItemByElementId:function(id) {
		return _.findWhere(this.draggers, {id:id});
	},
	submit:function() {
		this.grade();
		this.setAttempted();

		// if we are not giving feedback just call next
		if(this.config.sFeedbackType == 'none') {
			this.next();
			return;
		}
		this.state('feedback');
		// allow another try or show feedback
		if(!this.isCorrect() && this.canAttempt()) {
			this.state('active');
		}
	},
	getFeedback:function() {
		var fb, isCorrect = this.isCorrect();

		switch(this.config.sFeedbackType) {
			case 'general':
				fb = this.getArg('feedback' +  (isCorrect ? 'Correct' : 'Incorrect'));
				break;
			case 'specific':

				fb = this.model.get('sOrder'+this.getCurrentOrder().join()+'Feedback');
				break;
		}

		if(!isCorrect && !this.canAttempt() && this.getArg('feedbackLast')) {
			fb = this.getArg('feedbackLast');
		}
		return fb;
	},
	next:function() {
		this.triggerGlobal('command:run', 'next');
	},
	onDisabled:function() {
		this.$('.js-list').sortable( "disable" );
	},
	onEnabled:function() {
		this.$('.js-list').sortable( "enable" );
	}
});

Blaze.Adaptors.add('ListSort', function(node) {
	var m = this.model.toJSON();
		m.draggers = this.draggers;
		return m;
});