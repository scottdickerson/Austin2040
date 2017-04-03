(function() {
	Blaze.Debug.addPanel('configs',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'configs:loaded':'onConfigLoaded'
		},
		initialize:function() {
			this.render();
		},
		render:function(cfgs) {
			var html = "No Configs Found";
			if(cfgs) {
				html = '<table class="debug-table">';
				_.each(cfgs, function(c) {
					html += '<tr><th colspan="2">'+c.id+'</th></tr>';
					_.each(c, function(v, k) {
						if(k == 'id') { return; }
						html += '<tr><td>'+k+'</td><td>'+v+'</td></tr>';
					});

				});
				html += "</table>";


			}
			this.$el.html(html);
		},
		onConfigLoaded:function() {
			this.render(Blaze.Configs.getAll());
		},
		getPanelHelp:function() {
			return "The configs panel allows for viewing of all set Blaze.Configs config profiles available";
		}
	}));

})();

