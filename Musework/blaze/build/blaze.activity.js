/*! this is a compiled file do not change blaze - v0.1.2 - 2015-03-18 */
(function() {
Blaze.Mixer.add('activity', {
	args:{
		completed:'bActivityCompleted',
		started:'bActivityStarted'
	},
	markStarted:function() {
		this.model.set(this.args.started, true);

		if(this.hasMixin('globalEvents')) {
			this.triggerGlobal('activity:started', this.model, this);
		}
	},
	isStarted:function() {
		return this.model.get(this.args.started);
	},
	markCompleted:function() {
		this.model.set(this.args.completed, true);

		if(this.hasMixin('globalEvents')) {
			this.triggerGlobal('activity:completed', this.model, this);
		}
	},
	isCompleted:function() {
		return this.model.get(this.args.completed);
	},
	// go to next seg
	next:function() {
		this.triggerGlobal('command:run', 'next');
	}

});

// requires configurable mixin
// expects model is Blaze.Model
Blaze.Mixer.add('attempts', {
	defaultConfig:{
		nTries:0
	},
	args:{
		tries:'nTries',
		record:'nAttemptRecord'
	},
	profileReady:function() {
		this.model.set(this.args.tries, 0);
	},
	canAttempt:function() {
		return this.getAttempt() <= this.config.nTries;
	},
	setAttempted:function(record) {
		this.model.incCounter(this.args.tries);

		if(record) {
			this.recordAttempt(record);
		}
	},
	getAttempt:function() {
		return this.model.get(this.args.tries);
	},
	resetAttempts:function() {
		this.model.set(this.args.tries, 0);
		this.model.set(this.args.record, []);
	},
	recordAttempt:function(value) {
		this.model.setPush(this.args.record, value);
	},
	getAttemptRecord:function(n) {
		var r = this.model.get(this.args.record);
		if(!r) {
			return;
		}
		return (n) ? r[n] : r;
	},
	mixinBeforeRemove:function() {
		this.resetAttempts();
	}
});



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

Blaze.Mixer.add('timed', {
	// implement this in your class
	// requires configurable mixin
	onTimeReset:function() {},
	onTimeUp:function() {},
	onTimerTick:function() {},
	mixinBeforeInitialize:function() {
		_.bindAll(this, '_tickCountdown');
		this._timerActive = false;
	},
	mixinAfterInitialize:function() {

	},
	defaultConfig:{
		bCountdown:false,
		nTimer:30
	},
	startCountdown:function() {
		if(!this.config.bCountdown) {
			return;
		}
		this.resetCountdown();

		// close enough method for timing
		if(!this._timerActive) {
			this._timerActive = true;
			this._tickNext();
		}
	},
	stopCountdown:function() {
		this._timerActive = false;
	},
	resetCountdown:function() {
		this.model.set('timer', this.config.nTimer);
		this.onTimeReset();
	},
	_tickCountdown:function() {
		var t = this.model.decCounter('timer');
		if(t === 0) {
			this.stopCountdown();
			this.trigger('timer:out', t);
			this.onTimeUp(t);
		}else{
			this.onTimerTick(t);
			this.trigger('timer:tick', t);
			this._tickNext();
		}
	},
	_tickNext:function() {
		this._timeout = setTimeout(this._tickCountdown, 1000);
	},
	mixinBeforeRemove:function() {
		if(this._timeout) {
			clearTimeout(this._timeout);
		}
		this._timeout = null;
	}
});

Blaze.dna.DragDrop =  Blaze.View.extend({
	className:'activity-mult-select',
	mixins:[
		'hashBinder',
		'globalEvents',
		'templated',
		'configurable',
		'statefull',
		'gradable',
		'toggleEnabled',
		'shortcuts',
		'transitionable'
	],
	events:{

	},
	defaultConfig:{
		elDragArea:'.js-dragarea',
		elContainer:'body',
		nDraggerZ:600,
		aDraggerArgs:['sDragger[n]', 'sDragger[n]Text'],
		aBayArgs:['sBay[n]', 'sBay[n]Name', 'sBay[n]Draggers', 'sBay[n]Capacity'],
		bShuffleDraggers:true,
		bShuffleBays:true,
		bNormalizeWidth:true,
		bNormalizeHeight:false
	},
	templateId:'dragndrop',
	profileReady:function() {
		_.bindAll(this, 'drop');
		this.getDraggers();
		this.getBays();

	},
	states:{
		ready:{
			enter:function() {

			}
		},
		active:{
			enter:function() {

			}
		},
		feedback:{
			enter:function() {

			}
		}
	},
	getDraggers:function() {
		this.draggers = this.model.groupForDisplay(this.config.aDraggerArgs, this.config.bShuffleDraggers, 'dragger_', 'sDragger');
	},
	getBays:function() {
		this.bays = this.model.groupForDisplay(this.config.aBayArgs, this.config.bShuffleBays, 'bays_', 'sBay');
	},
	normalizeWidth:function() {
		var mw =  _.max(_.map(this.$('.js-dragger'), function(d) { return $(d).innerWidth(); }));
		_.each(this.$('.js-bay, .js-dragger') , function(b) { $(b).width(mw); });
	},
	render:function() {
		var m = this.getTemplateData();
		this.template(this.getTemplateIdOr(), m);

		this.initDraggers();
		this.initBays();
	},
	getTemplateData:function() {
		var m = this.model.toJSON();
		m.draggers = this.draggers;
		m.bays = this.bays;
		m.config = this.config;
		return m;
	},

	initDraggers:function() {
		var self = this;
		this.$('.js-dragger').draggable({
			containment: this.config.elDragArea,
			appendTo: this.config.elContainer,
			zIndex: this.config.nDraggerZ,
			revert: function() {
				return self.valid($(this));
			},
			start: function( event, ui ) {
				self.start($(this));

			}
		});
	},
	initBays:function() {
		this.$('.js-bay').droppable({ drop: this.drop });
	},
	getDraggerById:function(id) {
		return _.findWhere(this.draggers, {id:id});
	},
	getBayById:function(id) {
		return _.findWhere(this.bays, {id:id});
	},
	start:function(el) {
		var data = this.getDraggerById(el.attr('id')),
			inBay = el.data('inBay');

		if(!inBay) { return; }
		el.data('inBay', false).removeClass('in-bay');
		data.bay = null;
		data.inBay = false;
	},
	drop:function(e, ui) {
		this.addDraggerToBay( ui.draggable.attr('id') , $(e.target).attr('id'));
	},
	valid:function(el) {
		var valid = el.data('inBay');

		if(!valid) {
			this.resetDragger(el);
		}
		return !valid;
	},
	addDraggerToBay:function(did, bid){
		var dragger = this.getDraggerById(did),
			bay = this.getBayById(bid),
			elDragger = this.$("#"+dragger.id),
			elBay = this.$('#'+bay.id);

		if(!bay.draggers) {
			draggers = [];
		}else if(bay.draggers.length > 0) {
			// is bay occupied and only allow 1 dragger

		}
		dragger.bay = bay.sBay;
		dragger.inBay = true;

		elDragger.data('inBay', true).addClass('in-bay');
		this.alignToBay(elDragger, elBay);

	},
	removeDraggerFromBay:function(did, bid) {
		var dragger = this.getDraggerById(did),
			bay = this.getBayById(elBay.attr('id'));

		// is bay occupied and only allow 1 dragger
		dragger.bay = null;
		dragger.inBay = false;

		this.$("#"+dragger.id).data('inBay', false).removeClass('in-bay');

	},
	resetDragger:function(elDrag) {
		elDrag.data("uiDraggable").originalPosition = { top:0, left:0 };
	},
	isAllDropped:function() {
		return _.every(this.draggers, function(d) {
			return d.inBay;
		});
	},
	// just have top left alignment for now
	alignToBay:function(dragger, bay){
		var drop_p = bay.offset(),
			drag_p = dragger.offset(),
			left_end = drop_p.left - drag_p.left,
			top_end = drop_p.top - drag_p.top;

		if(this.config.nBayDockOffsetY) {
			top_end = top_end + this.config.nBayDockOffsetY;
		}
		if(this.config.nBayDockOffsetX) {
			left_end = left_end + this.config.nBayDockOffsetX;
		}

		dragger.animate({
			top: '+=' + top_end,
			left: '+=' + left_end
		});
	},
	// clean up
	beforeRemove:function() {
		$('.js-dragger').draggable( "destroy" );
		$('.js-bay').droppable( "destroy" );
	}
});

Blaze.dna.FillInBlanks = Blaze.View.extend({
	className:'activity-fill-in-blanks',
	mixins:[
		'hashBinder',
		'globalEvents',
		'templated',
		'configurable',
		'statefull',
		'activity',
		'gradable',
		'toggleEnabled',
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
	defaultConfig:{
		elDragArea:'.js-dragarea',
		nDraggerZ:600,
		aDraggerArgs:['sDragger[n]', 'sDragger[n]Text'],
		aBayArgs:['sBay[n]', 'sBay[n]Text', 'sBay[n]Draggers'],
		bShuffleDraggers:true,
		bShuffleBays:true,
		bNormalizeWidth:false,
		bNormalizeHeight:false,
		sBayDelimiter:/_+/,
		bAutoSubmit:true, // submits if all dropped
		bRetryTillCorrect:true, // no feedback untill all are correctly dropped
		bRetryOnlyIncorrect:true // do not replace corrcet draggers on retry
	},
	templateId:'dragndrop',
	profileReady:function() {
		_.bindAll(this, 'drop');
		this.getDraggers();
		this.getBays();

	},
	states:{
		ready:{
			enter:function() {

			}
		},
		active:{
			enter:function() {

			}
		},
		feedback:{
			enter:function() {

			}
		}
	},
	getDraggers:function() {
		this.draggers = this.model.groupForDisplay(this.config.aDraggerArgs, this.config.bShuffleDraggers, 'dragger_', 'sDragger');
		console.log('DRAGGERS', this.draggers);
	},
	getBays:function() {
		var del = this.config.sBayDelimiter;
		this.bays = this.model.groupForDisplay(this.config.aBayArgs, this.config.bShuffleBays, 'bays_', 'sBay');

		_.each(this.bays, function(b) {
			var s = b.sBayText.split(del);
			b.sText1 = s[0];
			b.sText2 = s[1];
			b.draggers = [];
		});

		console.log('BAYS', this.bays);
	},
	normalizeWidth:function() {
		var mw =  _.max(_.map(this.$('.js-dragger'), function(d) { return $(d).innerWidth(); }));
		_.each(this.$('.js-bay, .js-dragger') , function(b) { $(b).width(mw); });
	},
	render:function() {
		var m = this.getTemplateData();
		this.template(this.getTemplateIdOr(), m);

		this.initDraggers();
		this.initBays();
	},
	getTemplateData:function() {
		var m = this.model.toJSON();
		m.draggers = this.draggers;
		m.bays = this.bays;
		m.config = this.config;
		return m;
	},

	initDraggers:function() {
		var self = this;
		this.$('.js-dragger').draggable({
			containment: this.config.elDragArea,
			appendTo: this.config.elContainer,
			zIndex: this.config.nDraggerZ,
			revert: function() {
				return self.valid($(this));
			},
			start: function( event, ui ) {
				self.start($(this));

			}
		});
	},
	initBays:function() {
		this.$('.js-bay').droppable({ drop: this.drop });
	},
	getDraggerById:function(id) {
		return _.findWhere(this.draggers, {id:id});
	},
	getBayById:function(id) {
		return _.findWhere(this.bays, {id:id});
	},
	start:function(el) {
		var dragger = this.getDraggerById(el.attr('id'));
		if(dragger && dragger.inBay) {
			this.removeDraggerFromBay(dragger, dragger.bay);
		}
	},
	drop:function(e, ui) {
		this.addDraggerToBay(ui.draggable.attr('id') , $(e.target).attr('id'));
	},
	valid:function(el) {
		var valid = el.data('inBay');

		if(!valid) {
			this.resetDraggerEl(el);
		}
		return !valid;
	},
	addDraggerToBay:function(did, bid){
		var currentDragger, dragger = this.getDraggerById(did),
			bay = this.getBayById(bid),
			elDragger = this.$("#"+dragger.id),
			elBay = this.$('#'+bay.id);

		//console.log('addDraggerToBay', bay.draggers, bay.draggers.length);

		if(bay.draggers.length > 0) {
			// is bay occupied and only allow 1 dragger
			currentDragger = bay.draggers[0];
			this.removeDraggerFromBay(currentDragger, bay);
			this.resetDraggerEl(this.$('#'+currentDragger.id));
		}


		dragger.bay = bay;
		dragger.inBay = true;

		bay.draggers.push(dragger);

		console.log('DRAGGERS', bay.draggers);

		elDragger.data('inBay', true).addClass('in-bay');
		this.alignToBay(elDragger, elBay);

		if(this.isAllDropped()) {
			if(this.config.bAutoSubmit) {
				this.submit();
			}else{
				this.state('active');
			}
		}

	},
	removeDraggerFromBay:function(dragger, bay) {
		// is bay occupied and only allow 1 dragger
		dragger.bay = null;
		dragger.inBay = false;

		bay.draggers = [];
		this.$("#"+dragger.id).data('inBay', false).removeClass('in-bay');

	},
	resetDraggerEl:function(el) {
		el.data("uiDraggable").originalPosition = { top:0, left:0 };
		el.stop().animate({
			top: "0px",
			left: "0px"
		});
	},
	isAllDropped:function() {
		return _.every(this.draggers, function(d) {
			return d.inBay;
		});
	},
	// just have top left alignment for now
	alignToBay:function(dragger, bay){
		var drop_p = bay.offset(),
			drag_p = dragger.offset(),
			left_end = drop_p.left - drag_p.left,
			top_end = drop_p.top - drag_p.top;

		if(this.config.nBayDockOffsetY) {
			top_end = top_end + this.config.nBayDockOffsetY;
		}
		if(this.config.nBayDockOffsetX) {
			left_end = left_end + this.config.nBayDockOffsetX;
		}

		dragger.animate({
			top: '+=' + top_end,
			left: '+=' + left_end
		});
	},
	submit:function() {
		console.log('SUBMIT');
		if(this.isAllCorrect()) {
			// do feedback
			this.markAllComplete();
			this.renderFeedback();
		}else{
			if(this.config.bRetryTillCorrect) {
				this.resetInncorretDraggers();
			}
			// TODO handle normal popup feedback
		}

	},
	resetInncorretDraggers:function() {
		_.each(this.bays, function(bay) {
			var dragger = bay.draggers[0],
				el = this.$('#'+dragger.id);
			if(!dragger) {
				return false;
			}
			el = this.$('#'+dragger.id);
			if(bay.draggers[0].sDragger != bay.sBayDraggers) {

				this.removeDraggerFromBay(dragger, bay);
				this.resetDraggerEl(el);
			}else{
				// disable this dragger
				el.addClass('correct').draggable( "disable" );
			}
		}, this);
	},
	markAllComplete:function() {
		_.each(this.draggers, function(dragger) {
			this.$('#'+dragger.id).addClass('correct');
		}, this);
	},
	resetAllDraggers:function() {

	},
	isAllCorrect:function() {
		return _.every(this.bays, function(b) {
			var dragger = b.draggers[0];
			if(!dragger) {
				return false;
			}
			return b.draggers[0].sDragger == b.sBayDraggers;
		});
	},
	// clean up
	beforeRemove:function() {
		$('.js-dragger').draggable( "destroy" );
		$('.js-bay').droppable( "destroy" );
	}
});

// hotspot activity controller

Blaze.dna.Hotspot = Blaze.View.extend({
	className:'activity-hotspot hotspot-selected-none',
	mixins:[
		'hashBinder',
		'globalEvents',
		'templated',
		'configurable',
		'gradable',
		'activity',
		'toggleEnabled',
		'shortcuts',
		'transitionable'
	],
	events:{
		'click .js-hotspot':'select',
		'click .js-hotspot-close':'closePopup'
	},
	// these can be auto loaded from a config profile
	transitions:{},
	args:{
		noneSelected:'sHotspotNoneText',
		noneSelectedHeader:'sHotspotNoneHeader'
	},
	defaultConfig:{
		bDeselctable:true, // can you click on a hotspot to deselect
		bEnabled:true, // should the hotspots be enbaled by default
		bShuffle:false, // shuffle the hotspots
		sFollow:false, // TODO implement hotspot follow mode
		sHotpotArgs:['sHotspot[n]','sHotspot[n]Label', 'sHotspot[n]Header', 'sHotspot[n]Text', 'sHotspot[n]Viewed'],
		sHotspotTemplate:null,
		sTemplate:null
	},
	render:function() {
		this.template(this.getTemplateIdOr(), this.getTemplateData());
		// this will apply a transition if needed
		this.mixinAfterRender();
	},
	// once we have a config get the hotspots from the model
	profileReady:function() {
		this.hotspots = this.model.groupForDisplay(this.config.sHotpotArgs, this.config.bShuffle, 'hs_', 'sHotspot');
		this.$el.addClass('hospot-count-'+this.hotspots.length);
	},
	getTemplateData:function() {
		var m = this.model.toJSON();
		m.hotspots = this.hotspots;
		m.config = this.config;
		return m;
	},
	// called on hotspot click
	select:function(e) {
		var el = $(e.currentTarget);

		if(!this.isEnabled() || el.hasClass('.hotspot-disabled')) {
			return;
		}
		this.setSelected(el.attr('id'), el);
	},
	setSelected:function(id, el) {
		var self = this, hs = this.getHotspotById(id);

		if(!this.selected) {
			this.selectHotspot(hs);
			return;
		}

		// just deselect
		if(this.selected && this.selected.id == hs.id) {
			if(this.config.bDeselctable) {
				// no need for a promise
				this.deselectHotspot(this.selected).then(function() {
					self.setDefaltText();
				});
			}
			return;
		}

		this.deselectHotspot(this.selected).then(function() {
			self.selectHotspot(hs);
		}).fail(function (error) {
			console.error(error, error.stack);
		});

		// set viewed on model
		this.model.set('sHotspot'+hs.i+'Viewed', true);
	},
	setDefaltText:function() {
		this.$('.js-hotspot-text').text(this.getArg('noneSelected'));
		this.$('.js-hotspot-header').text(this.getArg('noneSelectedHeader'));
	},
	deselectHotspot:function(hs) {
		var self = this,
			trans = this._transitions['hotspotOut'+hs.i] || this._transitions.hotspotOut,
			func = function() {
				self.onHotspotDeslected(hs, hs.i);
			};
		return (trans) ?  this.transition(trans, hs.i).then(func) : Q.fcall(func);
	},
	onHotspotDeslected:function(hs, i) {
		if(this.config.sHotspotTemplate) {
			this.$('.js-hotspot-popup').empty();
		}else{
			this.$('.js-hotspot-label').html('');
			this.$('.js-hotspot-text').text('');
			this.$('.js-hotspot-header').text('');
		}
		this.$('.js-hotspot-popup').removeClass('hotspot-popup-'+hs.i);
		this.$('#'+hs.id).removeClass('hotspot-selected');
		this.$el.removeClass('hotspot-selected-'+hs.i).addClass('hotspot-selected-none');
		this.selected = null;
	},
	selectHotspot:function(hs) {
		var self = this,
			trans = this._transitions['hotspotIn'+hs.i] || this._transitions.hotspotIn;

		this.onHotspotSelected(hs);

		if(trans) {
			return this.transition(trans, hs.i);
		}
	},
	onHotspotSelected:function(hs) {
		if(this.config.sHotspotTemplate) {
			this.subTemplate('.js-hotspot-popup', this.config.sHotspotTemplate, hs);
		}else{
			this.$('.js-hotspot-label').html(hs.sHotspotLabel);
			this.$('.js-hotspot-text').html(hs.sHotspotText);
			this.$('.js-hotspot-header').html(hs.sHotspotHeader);
		}
		this.$('.js-hotspot-popup').addClass('hotspot-popup-'+hs.i);
		this.$('#'+hs.id).addClass('hotspot-selected hotspot-visited');
		this.$el.removeClass('hotspot-selected-none').addClass('hotspot-selected-'+hs.i);

		this.selected = hs;
	},
	getHotspotById:function(id) {
		return _.findWhere(this.hotspots, {id:id});
	},
	setHotspotText:function(hs) {
		if(!hs.sHotspotText) { return; }
		this.$('.js-hotspot-text').html(hs.text.sHotspotText);
	},
	closePopup:function() {
		if(this.selected) {
				// no need for a promise
			this.deselectHotspot(this.selected).then(function() {
				self.setDefaltText();
			});
		}
	}
});

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


/*
activity where the user moves thumb to
 */

Blaze.dna.PieSlider = Blaze.View.extend({
	className:'activity-pie-slider',
	mixins:[
		'hashBinder',
		'globalEvents',
		'statefull',
		'templated',
		'configurable',
		'toggleEnabled',
		'activity',
		'gradable',
		'attempts',
		'transitionable',
		'timed'
	],
	args:{
		percent:'nPercent',
		correct:'nCorrect'
	},
	events:{
		'mousedown .js-thumb':'startDrag',
		'touchstart .js-thumb' : 'startDrag',
		'click .js-close':'close',
		'click .js-next':'next',
		'click .js-submit':'submit',
		'click .js-try':'tryAgian'
	},
	defaultConfig:{
		sTemplate:'PieSlider',
		cBgColor:'#333333',
		bBackgroundCircle:false,
		cSliceColor:'#c66901',
		cInnerColor:'#000000',
		nDiameter:252,
		bInnerCircle:false,
		nInnerDiameter:140,
		nThumbDiameter:195,
		nCanvasWidth:252,
		nCanvasHeight:252,
		nTolerance:10, // how close to be considered correct in percent
		nDegreeOffset:270, // oreiented to the bottom
		sCanvasId:'.js-chart',
		sPercentLabelId:'.js-percent',
		sThumbId:'.js-thumb',
		sTipId:'.js- tip',
		bModal:false
	},
	initialize:function() {
		_.bindAll(this, 'drag', 'release');
	},
	render:function() {
		this.template(this.getTemplateIdOr(), this.getTemplateData(this.config.sAdaptor));
        this.state('active');
        this.mixinAfterRender();

		var self = this;
		window.setPer = function(n) {
			self.model.set('nPercent', n);
			self.update();
		};
		window.setOffset = function(n) {
			self.config.nDegreeOffset = n;
		};
	},
	states:{
		active:{
			enter:function() {
				this.reset();
				this.enable();
				this.update();
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
					//this.resetChoices();
				}
			}
		},
		feedback:{ // sumited - cannot alter - cannot submit
			enter:function() {
				this.disable();
				this.renderFeedback();
				this.drawResult();
				this.markCompleted();
			}
		},
		review:{ // TODO just restored cannot select cannot submit
			enter:function() {
				this.disable();
				this.update();
				this.renderFeedback();
				this.drawResult();
			}
		}
	},
	evaluator:function(model) {
		var a = this.getArg('percent'),
			b = this.getArg('correct');

		//console.log('answered', a, 'correct', b);

		return !_.isUndefined(a) && _.isEqual(a, b);
	},
	submit:function() {
		if(!this.isState('active')) { return; } // can only submit in active state

		var correct = this.grade();
		this.setAttempted(this.getArg('percent'));

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
	startDrag:function(e) {
		if(!this.isState('active')) { return; }
		e.preventDefault();
		this.setPointer();
		this.getThumb().addClass('pressed');
		this.bindWindow();
	},
	drag:function(e) {
		e.preventDefault();

		var p = this.getMousePosition(e),
			cp = this.getCanvasCenter(),
			rads = Math.atan2(p.y - cp.y, p.x - cp.x);
			ang = Math.round(this.radiansToDegrees(rads));

		// normalize angle
		if (ang < 0) {
			ang += 360;
		}
		ang -= 360;
		ang = Math.abs(ang);

		this.setPercent(this.calcPercentFromAngle(ang));
		this.update();
	},

	release:function() {
		this.removePointer();
		this.releaseWindow();
		this.getThumb().removeClass('pressed');
	},
	update: function(){
		var per = this.getArg('percent'),
			arc = this.getArc(per);


		//console.log('tp', tx, ty);
		this.drawChart(this.getContext(this.config.sCanvasId), arc);
		this.setThumbPosition(arc);
		this.updateLabel(this.config.sPercentLabelId, per);

		// set tab position

	},
	setThumbPosition:function(arc) {
		var trad = this.config.nThumbDiameter / 2,
			x = (trad * Math.cos(arc.end)) + (this.config.nCanvasWidth / 2),
			y = (trad * Math.sin(arc.end))+ (this.config.nCanvasHeight / 2);
		this.getThumb().css({top:y+'px', left:x+'px'});
	},
	drawChart:function(ctx, arc) {
		var y = this.config.nCanvasHeight / 2,
			x = this.config.nCanvasWidth / 2;

		this.clearChart(ctx);
		if(this.config.bBackgroundCircle === true) {
			this.drawCircle(ctx, this.config.nDiameter / 2, x, y, this.config.cBgColor);
		}

		this.drawArc(ctx, this.config.nDiameter / 2, x, y, arc.start, arc.end);

		// draw inner circle (if inner diameter is 0 do nothing)
		if(this.config.bInnerCircle === true) {
			this.drawCircle(ctx, this.config.nInnerDiameter / 2, x, y, this.config.cInnerColor);
		}
	},


	drawResult:function() {
		var n = this.getArg('correct');
		this.drawChart(this.getContext('.js-result'), this.getArc(n));
		this.updateLabel('.js-percent-actual', n);
	},
	clearChart:function(ctx) {
		ctx.clearRect(0, 0, this.config.nDiameter, this.config.nDiameter);
	},

	setPercent:function(per) {
		//console.log('PERC', per);
		this.model.set(this.args.percent, per);
	},
	calcPercentFromAngle:function(ang){
		var percAng = ang - this.config.nDegreeOffset;
		if (percAng < 0) {
			percAng += 360;
		}
		return 100 - Math.floor(100 * percAng / 360);
	},
	getThumb:function() {
		return this.$el.find(this.config.sThumbId);
	},
	hideThumb:function() {
		this.getThumb().hide();
	},
	showThumb:function() {
		this.getThumb().show();
	},
	radiansToDegrees:function(angle) {
		return angle * (180 / Math.PI);
	},
	degreesToRadians:function(angle) {
		return angle * (Math.PI / 180);
	},
	percentToAngle:function(per) {
		return Math.round(per * (360 / 100));
	},
	angleToPercent:function() {

	},
	updateLabel: function(lbl, per){
		this.$el.find(lbl).text(per + '%');
	},
	hideTooltip:function() {
		this.$el.find(this.config.sTipId).fadeOut(200);
	},
	beforeRemove:function() {
		this.removePointer();
		this.releaseWindow();
	},
	setPointer:function() {
		$("body").css('cursor', 'pointer');
	},
	removePointer:function() {
		$("body").css('cursor', 'default');
	},
	bindWindow:function() {
		$(window).on('mousemove touchmove', this.drag);
        $(window).on('mouseup touchend', this.release);
	},
	releaseWindow:function() {
		$(window).off('mousemove touchmove', this.drag);
        $(window).off('mouseup touchend', this.release);
	},
	getCanvasCenter:function() {
		var cp = this.$(this.config.sCanvasId).offset();

		return {
			y: cp.top +  (this.config.nCanvasHeight / 2),
			x: cp.left + (this.config.nCanvasWidth / 2),
		};
	},
	getMousePosition:function(e) {
		var evt =  (e.type === 'touchmove') ? e.originalEvent.changedTouches[0] : e;
		return {
			y: evt.clientY,
			x: evt.clientX
		};
	},
	reset:function() {
		this.model.set(this.args.percent, 0);
	},


	/* ------------------------------ drawing methods ------------------------------- */
	getContext:function(id) {
		return this.$el.find(id)[0].getContext('2d');
	},
	getArc:function(per) {
		var start = this.config.nDegreeOffset % 360,
			end = (start - Math.round(per * (360 / 100))) % 360;

		start -= 360;
		start = Math.abs(start);
		end -= 360;
		end = Math.abs(end);

		return{
			start:this.degreesToRadians(start),
			end:this.degreesToRadians(end)
		};
	},
	drawArc:function(ctx, radius, x, y, start, end) {

		ctx.fillStyle = this.config.cSliceColor;
		ctx.beginPath();
		ctx.arc(x, y, radius, start, end , false);

		ctx.arc(x, y ,this.config.nInnerDiameter / 2 , end, start, true);
		ctx.fill();
	},
	drawCircle:function(ctx, radius, x, y, color) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, radius ,0, 2 * Math.PI, false);
		ctx.fill();
	}

});

// Requires jquery-ui (not included in blaze.dependencies)

Blaze.dna.Slider = Blaze.View.extend({
	className:'activity-slider',
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
	events:{
		'slidechange .js-slider':'slideChange',
		'click .js-submit':'submit',
	},
	args:{
		max:'nMax',
		min:'nMin',
		correct:'sCorrect',
		start:'nStart',
		step:'nStep'
	},
	defaultConfig:{
		sTemplate:'Slider',
		sAdaptor:'Slider',
		bMulti:false,
		bRepeatable:true,
		bAutoSubmit:false,
		sOrientation:"horizontal",
		bRange:false,
		nStep:1,
		nLabelStep:1
	},
	states:{
		active:{
			enter:function() {

			}
		},
		pause:{
			enter:function() {

			}
		},
		feedback:{
			enter:function() {

			}
		},
		review:{
			enter:function() {

			}
		}
	},
	render:function() {
		this.template(this.getTemplateIdOr(), this.getTemplateData(this.config.sAdaptor));
		this.state('ready');


		this.mixinAfterRender();

		this.initSlider();
	},
	initSlider:function() {
		this.slider = $('.js-slider').slider({
			min:this.getArg('min'),
			max:this.getArg('max'),
			orientation:this.config.sOrientation,
			range:this.config.bRange,
			step:this.getArg('step') || this.config.nStep,
			start:this.getArg('start')
		});
	},
	slideChange:function(e, ui) {
		console.log('slider change', e, ui);
		if(this.config.bAutoSubmit) {
			this.submit();
		}
		this.setAnswered($( ".js-slider" ).slider( "value"));
	},
	evaluator:function() {
		var ranges, correct = this.getArg(this.args.correct),
			a = this.getAnswered();
		if(!correct && !a) {
			return false;
		}

		// if we are looking for a specific number
		if(_.isNumber(correct)) {
			return _.isEqual(a, correct);

		// we are looking for a range e.g: 1, 4
		}else if(_.isString(correct)) {
			ranges = correct.split(Blaze.regx.splitCommaTrim);


			return a >= parseInt(ranges[0]) && a <= parseInt(ranges[1]);
		}

	},
	submit:function() {
		this.grade();
		this.setAttempted(this.getAnswered());

		console.log('EVAL', this.evaluator());
	}
});

Blaze.dna.Sorting =  Blaze.View.extend({
	className:'activity-sorting',
	mixins:[
		'hashBinder',
		'globalEvents',
		'templated',
		'configurable',
		'statefull',
		'activity',
		'gradable',
		'toggleEnabled',
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
	defaultConfig:{
		elDragArea:'.js-dragarea',
		elContainer:'body',
		nDraggerZ:600,
		aDraggerArgs:['sDragger[n]', 'sDragger[n]Name'],
		aBayArgs:['sBay[n]', 'sBay[n]Text', 'sBay[n]Draggers', 'sBay[n]Capacity'],
		bShuffleDraggers:true,
		bShuffleBays:true,
		bNormalizeWidth:false,
		bNormalizeHeight:false,
		bAutoSubmit:true, // submits if all dropped
		bRetryTillCorrect:true, // no feedback untill all are correctly dropped
		bRetryOnlyIncorrect:true // do not replace corrcet draggers on retry
	},
	templateId:'dragndrop',
	profileReady:function() {
		_.bindAll(this, 'drop');
		this.getDraggers();
		this.getBays();
	},
	states:{
		ready:{
			enter:function() {

			}
		},
		active:{
			enter:function() {

			}
		},
		feedback:{
			enter:function() {

			}
		}
	},
	getDraggers:function() {
		this.draggers = this.model.groupForDisplay(this.config.aDraggerArgs, this.config.bShuffleDraggers, 'dragger_', 'sDragger');
	},
	getBays:function() {
		this.bays = this.model.groupForDisplay(this.config.aBayArgs, this.config.bShuffleBays, 'bays_', 'sBay');

		_.each(this.bays, function(b) {
			b.draggers = [];
			b.correct = b.sBayDraggers.split(Blaze.regx.splitCommaTrim);
		});
	},
	normalizeWidth:function() {
		var mw =  _.max(_.map(this.$('.js-dragger'), function(d) { return $(d).innerWidth(); }));
		_.each(this.$('.js-bay, .js-dragger') , function(b) { $(b).width(mw); });
	},
	render:function() {
		this.template(this.getTemplateIdOr(), this.getTemplateData());

		this.initDraggers();
		this.initBays();
	},
	getTemplateData:function() {
		var m = this.model.toJSON();
		m.draggers = this.draggers;
		m.bays = this.bays;
		m.config = this.config;
		return m;
	},

	initDraggers:function() {
		_.each(this.draggers, this.initDragger, this);
	},
	initDragger:function(dragger) {
		var self = this, el = this.$('#'+dragger.id);

		dragger.$el = el;
		el.draggable({
			containment: this.config.elDragArea,
			appendTo: this.config.elContainer,
			zIndex: this.config.nDraggerZ,
			revert: function() {
				return self.valid($(this));
			},
			start: function( event, ui ) {
				self.start($(this));

			}
		});
	},
	initBays:function() {
		_.each(this.bays, this.initBay, this);
	},
	initBay:function(bay) {
		var el = this.$('#'+bay.id);

		bay.$el = el;
		el.droppable({ drop: this.drop });
	},
	getDraggerById:function(id) {
		return _.findWhere(this.draggers, {id:id});
	},
	getBayById:function(id) {
		return _.findWhere(this.bays, {id:id});
	},
	start:function(el) {
		var bay, dragger = this.getDraggerById(el.attr('id'));
		if(dragger && dragger.inBay) {
			bay = dragger.bay;
			this.removeDraggerFromBay(dragger, bay);
			this.realignDraggers(bay);
		}
	},
	drop:function(e, ui) {
		this.addDraggerToBay( ui.draggable.attr('id') , $(e.target).attr('id'));
	},
	valid:function(el) {
		var valid = el.data('inBay');

		if(!valid) {
			this.resetDraggerEl(el);
		}
		return !valid;
	},
	addDraggerToBay:function(did, bid){
		var alignTo, dragger = this.getDraggerById(did),
			bay = this.getBayById(bid),
			elDragger = this.$("#"+dragger.id),
			elBay = this.$('#'+bay.id);

		if((!bay.sBayCapacity || bay.sBayCapacity == 1) && bay.draggers.length >= 1) {
			// is bay occupied and only allow 1 dragger
			currentDragger = bay.draggers[0];

			if(this.isDraggerDisable(currentDragger.id)) {
				this.resetDraggerEl(this.$('#'+dragger.id));
				return;
			}

			this.removeDraggerFromBay(currentDragger, bay);
			this.resetDraggerEl(this.$('#'+currentDragger.id));
		}else if(bay.draggers.length >= bay.sBayCapacity) {
			return;
		}


		alignTo = elBay.find('.js-align-'+bay.draggers.length);
		bay.draggers.push(dragger);
		dragger.bay = bay;
		dragger.inBay = true;

		elDragger.data('inBay', true).addClass('in-bay');

		this.alignToBay(elDragger, alignTo.length ? alignTo : elBay);

		if(this.isAllDropped() && this.config.bAutoSubmit) {
			this.submit();
		}

	},
	isDraggerDisable:function(id) {
		return $( "#"+id ).draggable( "option", "disabled" );
	},
	realignDraggers:function(bay) {
		_.each(bay.draggers, function(dragger, i) {
			this.alignToBay(dragger.$el, bay.$el.find('.js-align-'+i));
		}, this);
	},
	removeDraggerFromBay:function(dragger, bay) {
		// is bay occupied and only allow 1 dragger
		dragger.bay = null;
		dragger.inBay = false;

		bay.draggers = _.without(bay.draggers, dragger);
		this.$("#"+dragger.id).data('inBay', false).removeClass('in-bay');

	},
	resetDraggerEl:function(el) {
		el.data("uiDraggable").originalPosition = { top:0, left:0 };
		el.stop().animate({
			top: "0px",
			left: "0px"
		});
	},
	isAllDropped:function() {
		return _.every(this.draggers, function(d) {
			return d.inBay;
		});
	},
	submit:function() {
		if(this.isAllCorrect()) {
			// do feedback
			this.markAllComplete();
			this.renderFeedback();
			this.markCompleted();
		}else{
			if(this.config.bRetryTillCorrect) {
				this.resetInncorretDraggers();
			}
			// TODO handle normal popup try agian feedback
		}

	},
	isAllCorrect:function() {
		return _.every(this.bays, this.isBayCorrect, this);
	},
	isBayCorrect:function(bay) {
		var draggers = _.map(bay.draggers, function(dragger) { return dragger.sDragger; });

		//console.log('isBayCorrect', bay.correct, draggers, !_.difference(bay.correct, draggers));
		return !_.difference(bay.correct, draggers).length;
	},
	// just have top left alignment for now
	alignToBay:function(dragger, bay){
		var drop_p = bay.offset(),
			drag_p = dragger.offset(),
			left_end = drop_p.left - drag_p.left,
			top_end = drop_p.top - drag_p.top;

		if(this.config.nBayDockOffsetY) {
			top_end = top_end + this.config.nBayDockOffsetY;
		}
		if(this.config.nBayDockOffsetX) {
			left_end = left_end + this.config.nBayDockOffsetX;
		}

		//console.log('Get Bay OFFSET ', bay, drop_p);

		//console.log('ANIMATE DRAGGER ', top_end, left_end);

		dragger.animate({
			top: '+=' + top_end,
			left: '+=' + left_end
		});
	},
	resetInncorretDraggers:function() {
		_.each(this.bays, function(bay) {
			_.each(bay.draggers, function(dragger) {
				var el = this.$('#'+dragger.id);
				el.finish();
				if(!_.contains(bay.correct, dragger.sDragger)) {
					this.removeDraggerFromBay(dragger, bay);
					this.resetDraggerEl(el);
				}else{
					el.addClass('correct').draggable( "disable" );
				}
			}, this);
			this.realignDraggers(bay);
		}, this);
	},
	markAllComplete:function() {
		_.each(this.draggers, function(dragger) {
			this.$('#'+dragger.id).addClass('correct');
		}, this);
	},
	// clean up
	beforeRemove:function() {
		_.each(this.draggers, function(dragger) { dragger.$el = null; });
		_.each(this.bays, function(bay) { bay.$el = null; });
		$('.js-dragger').draggable( "destroy" );
		$('.js-bay').droppable( "destroy" );
	}
});

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
})();