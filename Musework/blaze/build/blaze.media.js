/*! this is a compiled file do not change blaze - v0.1.2 - 2015-03-18 */
(function() {


Blaze.dna.VideoController = Blaze.View.extend({
	mixins: ['templated', 'hashBinder', 'globalEvents', 'configurable'],
	className:'video-controller',
	initialize: function () {
        this._eventsCalled = {
            play: 0,
            ended: 0
        };
    },
    defaultConfig:{
		nVideoHeight:480,
		nVideoWidth:853,
		sTemplate:'Video',
		sAdaptor:'Video',
		sVideoPath:'video',
		sCaptionsPath:'video/captions'
    },
    events:{
        "click .js-next":"next"
    },
	render:function() {
		this.template(this.config.sTemplate, this.getTemplateData(this.config.sAdaptor));
		this.player = new MediaElementPlayer(this.$('video'), this.getPlayerSettings());
	},
	getPlayerSettings:function() {
		// note change default plugin path after livestrong to 'src/vendor/mediaelement/',
		return {
			//mode:'shim', // force flash (for testing)
			toggleCaptionsButtonWhenOnlyOne:true,
			pluginPath: this.config.pluginPath || 'shared/vendor/mediaelement/'

		};
	},
	beforeRemove:function() {
		this.autostart = false;
		if (this.player) {
			if (this.player.isFullScreen) {
				this.player.exitFullScreen();
			}
			this.player.$media.off();
			this.player.pause();
			this.player.remove();
			this.player = null;
		}
	},
	next:function() {
		Blaze.dispatcher.trigger('command:run', 'next');
	}
});

Blaze.Adaptors.add('Video', function(node) {
	var m = this.model.toJSON(),
		id = this.model.getFormatedNodeId('_');

	if(!m.sVideo) {
		m.sVideo = id;
	}
	if(!m.sCaptions) {
		m.sCaptions = id;
	}
	return m;
});
})();