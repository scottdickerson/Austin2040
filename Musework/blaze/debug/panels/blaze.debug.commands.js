(function() {
	// list and commands and shortcuts and command run button
	//
	//
	var template = '<div><h4>Commands</h4></div><table class="debug-table"><tr><th>id</th><th style="width:40%">shortcut</th><th style="width:15%"></th></tr>{{#commands}}<tr><td>{{id}}</td><td>{{shortcut}}</td><td><span data-cmd="{{id}}" class="debug-button debug-cmd-run">run</span></td></tr>{{/commands}}</table><div><h4>Overrides</h4></div><table class="debug-table"><th>id</th><th style="width:40%">shortcut</th><th  style="width:15%"></th></tr>{{#overrides}}<tr><td>{{id}}</td><td>{{shortcut}}</td><td><span data-cmd="{{id}}" class="debug-cmd-run">run</span></td></tr>{{/overrides}}</table><div class="debug-row"><div class="debug-button debug-cmd-refresh">Refresh</div></div>';
	Blaze.Debug.addPanel('commands',  Blaze.Debug.Panel.extend({
		initialize:function() {

		},
		events:{
			'click .debug-cmd-refresh':'render',
			'click .debug-cmd-run':'runCmd'
		},
		onActivate:function() {
			this.render();
		},
		render:function() {
			this.$el.html(Blaze.Templates.renderRaw(template, Blaze.Commands.getCommandList()));
		},
		runCmd:function(e) {
			var cmd = $(e.currentTarget).data('cmd');
			if(cmd) {
				Blaze.Commands.run(cmd);
			}
		}
	}));
})();