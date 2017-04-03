(function() {

	var templates = {
		none:'<div class="debug-section">No Media available currently</div>',
		info:'<div class="debug-section debug-clear"><div class="debug-sync-left debug-right"><div class="debug-sync-seconds">Seconds<div id="Debug_Sync_Seconds" class="debug-sync-number">0</div></div></div><div>Duration: <span id="debug_sync_duration"></span></div></div>',
		controls:'<div class="debug-section debug-clear"><div id="Debug_Sync_Slider" class="debug-sync-slider debug-right"></div><div class="debug-button debug-sync-toggle">Play</div></div>'
	};
	Blaze.Debug.addPanel('sync',  Blaze.Debug.Panel.extend({
		initialize:function() {
			_.bindAll(this, 'updateTime', 'setDuration', 'setScruberPos');
			this.render();
		},
		events:{
			'click .debug-sync-toggle':'toggle'
		},
		globalEvents:{
			'audio:create':'onAudio',
			'video:create':'onVideo',
			'audio:destroy video:destroy':'release',
			'video:play audio:play':'onPlay',
			'video:pause audio:pause':'onPause',
			'node:before':'render'
		},
		render:function(player) {
			this.$el.html(templates.none);
		},
		onVideo:function(player) {
			this.media = 'video';
			this.$el.html('<h4>Video</h4>'+templates.info+templates.controls);
			this.setPlayer(player);
		},
		onAudio:function(player) {
			this.media = 'audio';
			this.$el.html('<h4>Audio</h4>'+templates.info+templates.controls);
			this.setPlayer(player);
		},
		setPlayer:function(player) {
			this.player = player;
			player.on('timeupdate', this.updateTime);
			player.on('durationchange', this.setDuration);

		},
		setDuration:function() {
			var d = this.player.duration();
			if(!_.isNaN(d)) {
				this.$('#debug_sync_duration').html(Math.round(d)+' seconds');
				this.createScruber(Math.round(d));
			}
		},
		updateTime:function() {
			var t = Popcorn.util.toSeconds(this.player.currentTime());
			this.$('#Debug_Sync_Seconds').html(Math.round(t));
			if(this.slider) {
				this.slider.slider('value', t);
			}
		},
		release:function() {
			if(this.player) {
				this.player.off('timeupdate', this.updateTime);
			}
			if(this.slider) {
				//this.slider.slider("destroy");
			}
		},
		toggle:function() {
			this.triggerGlobal(this.media+':toggle');
		},
		onPlay:function() {
			this.$('.debug-sync-toggle').text('pause');
		},
		onPause:function() {
			this.$('.debug-sync-toggle').text('play');
		},
		createScruber:function(duration) {
			if(_.isFunction($.fn.slider)) {
				this.slider = this.$('#Debug_Sync_Slider').slider({
					value: 0,
					step: 0.01,
					orientation: 'horizontal',
					range: 'min',
					max: duration,
					animate: true,
					slide:this.setScruberPos,
					stop:this.setScruberPos
				});
			}else{
				this.$('#Debug_Sync_Slider').html('jquery ui is required for scrubber');
			}
		},
		setScruberPos:function(e,ui) {
			this.player.currentTime(ui.value);
		}
	}));
})();