// view wrapper for popcorn video player
Blaze.dna.Video = Blaze.View.extend({
	mixins: ['templated', 'hashBinder', 'globalEvents', 'configurable'],
	className:'video-player',
	defaultConfig:{
		nVideoHeight:480,
		nVideoWidth:853,
		sTemplate:'Video',
		sAdaptor:'Video',
		sVideoPath:'video',
		sCaptionsPath:'video/captions',
		bAutoplay:true,
		sPlayerId:'VideoPlayer'
    },
	render:function() {
		this.template(this.config.sTemplate, this.getTemplateData(this.config.sAdaptor));

		this.player =  Popcorn('#'+this.config.sPlayerId);
		this.syncActions();
		if(this.config.bAutoplay) {
			this.player.play();
		}

	},
	// set up all media syncing
	syncActions:function() {
		// get all bullets
	},
	addBullet:function() {

	},
	beforeRemove:function() {

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



