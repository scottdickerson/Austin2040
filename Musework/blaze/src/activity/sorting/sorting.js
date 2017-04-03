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