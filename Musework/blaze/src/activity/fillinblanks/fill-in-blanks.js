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