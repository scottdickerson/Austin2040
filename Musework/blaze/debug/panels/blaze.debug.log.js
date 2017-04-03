(function() {
	//TODO add filtering
	Blaze.Debug.addPanel('log',  Blaze.Debug.Panel.extend({
		logLimit:500,
		globalEvents:{
			"all":"log"
		},
		events:{
			'click .debug-small-row':'highlight',
			'click .debug-clear':'clearLog'
		},
		initialize:function() {
			this._n = 0;
			this.$el.append('<div class="debug-section"><span href="#" class="debug-button debug-clear">clear-log</span></div>')
		},
		log:function() {
			var cls, a = _.toArray(arguments);
			this._n++;

			// strip any html from  asset:loaded
			if(a[0] == "asset:loaded") {
				a[1] = '[object Document]';
			}

			// remove any functions
			a = _.map(a, function(v) {
				return _.isFunction(v) ? '[function]' : v;
			})
			// add the event name so we can set classes for highlighting certian events
			cls = 'debug-small-row debug-log-'+a[0].replace(':', '-');

			this.$el.append('<div class="'+cls+'">event: <strong>'+a.shift()+'</strong>'+'<br />'+a.join(', ')+'</div>');

			// limit the number of events in the dom at any given time
			if(this._n > this.logLimit) {
				this.$(':first').remove();
			}
		},
		highlight:function(e) {
			this.$(e.currentTarget).toggleClass('debug-highlight');
		},
		clearLog:function() {
			this.$('.debug-small-row').remove();
		},
		getPanelHelp:function() {
			return 'The log panel logs all global events sent through the Blaze event dispatcher. You can increase the log limit by setting Blaze.Debug.getPanel("log").logLimit = 1000; after debug:ready has been fired.';
		}
	}));
})();