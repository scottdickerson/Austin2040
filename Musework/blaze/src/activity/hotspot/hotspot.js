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