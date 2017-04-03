(function() {
	Blaze.Debug.addPanel('labels',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'labels:loaded':'render'
		},
		initialize:function() {
			this.render();
		},
		render:function(labels) {
			var lbls, html = "No Labels Found";
			if(labels) {
				html = '<table class="debug-table">',
				lbls = labels.toJSON(),
				keys = _.keys(lbls).sort();


				_.each(keys, function(k) {
					html += "<tr><td>"+k+"</td><td>"+lbls[k]+"</td></tr>";
				});
				html += "</table>";
			}
			this.$el.html(html);
		}
	}));

})();