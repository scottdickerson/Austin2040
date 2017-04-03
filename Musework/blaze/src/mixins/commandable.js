Blaze.Mixer.add('commandable', {
	commands:{

	},
	mixinAfterInitialize:function(options) {
		var cmds;
		if(this.config && this.config.commands) {

			cmds = _.isString(this.config.commands) ? JSON.parse(this.config.commands) : this.config.commands;
			this.commands = _.extend(this.commands, cmds);
		}

		var evts = {};
		_.each(this.commands, function(v, k) {
			evts[k] = function() {
				Blaze.Commands.run(v);
			};
		});

		this.events = _.extend(this.events, evts);
		this.delegateEvents();
	}
});