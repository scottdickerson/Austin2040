(function() {

	var getConfig = function(proto) {
		if(!proto) {
			return '';
		}
		return '<p><strong>Default Config</strong></p>' + _.reduce(proto, function(html, v, k) {

			html += '<tr><td>'+k+'</td><td>'+v+'</td></tr>';

			return html;
		}, '<table class="debug-table">') + '</table>';
	};
	var getArgs = function(args) {
		if(!args || _.isEmpty(args)) {
			return '';
		}
		return '<p><strong>Args (may not be all args)</strong></p>' + _.reduce(args, function(html, v) {
			html += '<tr><td>'+v+'</td></tr>';
			return html;
		}, '<table class="debug-table">') + '</table>';
	};
	Blaze.Debug.addPanel('dna',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'templates:loaded':'renderData'
		},
		onActivate:function() {
			this.render();
		},
		render:function() {
			var html = '<h2>dna</h2>' + _.reduce(_.keys(Blaze.dna), function(s, v) {
				s += '<br /><h4>'+v+'</h4>';



				var proto = Blaze.dna[v].prototype;
				if(proto) {
					if(proto.args && !_.isEmpty(proto.args)) {
						s += getArgs(proto.args);
					}
					s += getConfig(proto.defaultConfig);
				}


				return s;
			}, '');
			this.$el.html(html);
		},
		getPanelHelp:function() {
			return 'This panel list all available dna (View) elements in application. These are used as sTemplate and sActivityType args';
		}
	}));
})();