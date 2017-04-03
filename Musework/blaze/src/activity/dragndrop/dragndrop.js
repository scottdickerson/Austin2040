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