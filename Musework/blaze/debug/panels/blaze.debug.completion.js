(function() {

	var templates = {
		main:'<h4>Completion</h4><div id="Debug_Completion_List"></div>',
		row:'<div id="DC_{{cid}}" class="debug-list-button-small debug-completion-row {{#complete}}debug-complete{{/complete}} debug-depth-{{depth}}" style="background-color:{{color}}"><div class="debug-reqs-list">[{{reqs}}]&nbsp;&nbsp;</div>{{id}}</div>'
	}
	var colors = {
		segment:"#e7edf2",
		clip: "#c4e0f2",
		section: "#b7caed",
		chapter: "#92e3ba",
		course:"#b9cbe2",
		branch:"#eee4c6",
		labels: "#d2e6a1",
		quiz:"#d9eed8"
	};
	Blaze.Debug.addPanel('completion',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'iledata:restored completion:ready':'renderData',
			'completion:set':'updateNode'
		},
		initialize:function() {
			_.bindAll(this, 'makeRow');
			this.$el.html(templates.main);
		},
		renderData:function(tree) {
			if(!tree) { return; }
			this.$('#Debug_Completion_List').html(tree.map(this.makeRow).join(''));
		},
		makeRow:function(node) {
			return Blaze.Templates.renderRaw(templates.row, {
				id:node.get('nodeid'),
				depth:node.get('depth'),
				reqs:node.get('_reqs'),
				cid:node.cid,
				complete:(node.get('bCompleted')),
				color:this.getColor(node.get('nodeType'))
			});
		},
		updateNode:function(node) {
			this.$('#DC_'+node.cid).addClass('debug-complete');
		},
		getColor:function(nodetype) {
			return colors[nodetype] || '#ffffff';
		}
	}));
})();