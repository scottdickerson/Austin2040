// include ift in page requires config
(function() {
	var id, config, module = '',
		initIFT = function() {
		   	iftRequire(['ift'], function(ift) {
		   		IFT.initialize(id, config);
		   	});

		   	// listen for segment change
            Blaze.dispatcher.on('node:before:render', function(node) {
            	setIftLoc(node.get('nodeid'));
            });
		},
		setIftLoc = function(nid) {
			IFT.setLocation(module+nid);
		};
		if(!location.hostname.match('localhost')) {
			var onLoaded = function() {
				var config = Blaze.Configs.get('ift');

				if(config && config.bEnabled && config.sId) {
					// remove listener
					Blaze.dispatcher.off('configs:loaded', onLoaded);
					if(config.sModule) {
						module = config.sModule + '/';
					}
					id = config.sId;

					window.initIFT = initIFT;

					$('head').append('<link rel="stylesheet" href="http://ift.enspirestudios.com/assets/ift-embed.css" />');
					$.getScript('http://ift.enspirestudios.com/assets/require.js', function() {
						$.getScript('http://ift.enspirestudios.com/assets/ift_no_conflict.js', function() {
							initIFT();
						});
					});
				}
			};

			Blaze.dispatcher.on('configs:loaded', onLoaded);
		}
})();