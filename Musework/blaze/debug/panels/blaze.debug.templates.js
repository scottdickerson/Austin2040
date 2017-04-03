(function() {
	Blaze.Debug.addPanel('templates',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'templates:loaded':'renderData'
		},
		onActivate:function() {
			this.render();
		},
		render:function() {
			var html = _.reduce(Blaze.Templates.getAvailable(), function(s, v, k) {
				s += '<h2>'+k+'</h2><table class="debug-table">'

				var a = _.map(v, function(id) {
					return '<tr><td>'+id+'</td></tr>';
				});

				s += (!a.length) ? '<tr><td>&nbsp;</td></tr>' : a.join('');

				s += '</table>';
				return s;
			}, '');
			this.$el.html(html);
		},
		getPanelHelp:function() {
			return 'The templates panel shows all available templates, partial templates, and template helper methods.'
		}
	}));
})();
