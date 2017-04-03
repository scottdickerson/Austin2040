// mixin commandClick
//
// requires: globalEvents
// usage:
//
Blaze.Mixer.add('commandClick', {
	mixinAfterInitialize:function(options) {
		this.cmd = options.command || ((this.model) ? this.model.get('command') : null) || this.id;

		if(!this.cmd) {
			console.error("commandClick no commandid given");
		}
	},
	events:{
		"click":"runCommand"
	},
	runCommand:function(e) {
		Blaze.Commands.run(this.cmd);
		e.preventDefault();
	}
});