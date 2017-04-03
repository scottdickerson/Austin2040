(function() {

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

	var inspectionTemplate = Mustache.compile('<div class="debug-inspect"><h2>{{nodeid}}</h2><h4>Args</h4><table class="debug-table">{{#args}}<tr><td>{{name}}</td><td>{{&value}}</td></tr>{{/args}}</table><div class="debug-text"><strong>template id:</strong> {{templateId}}<br /><strong>css class:</strong> {{className}}</div>{{#parent_nodeid}}<h4>parent</h4><div><a href="#" data-nodeid="{{parent_nodeid}}" class="debug-parent">{{parent_nodeid}}</a></div>{{/parent_nodeid}}{{#haschildren}}<h4>Children</h4><table>{{#children}}<tr><td><div><a href="#" data-nodeid="{{.}}" class="debug-children">{{.}}</a></div></td></tr>{{/children}}</table>{{/haschildren}}</div><br />');

	Blaze.Debug.addPanel('args',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'iledata:loaded':'renderData',
			'node:start':'setCurrentNode'
		},
		events:{
			'click .debug-list-button':'choose',
			'click .debug-parent':'choose',
			'click .debug-children':'choose',
			'click .debug-go-node':'go'
		},
		initialize:function() {
			_.bindAll(this, 'nodeInspect');
			this.render();

		},
		go:function(e) {
			var nodeid = this.$(e.currentTarget).parent().data("nodeid");
			Blaze.dispatcher.trigger('node:request', nodeid);
			e.preventDefault();
		},
		render:function() {
			this.$el.html('<div id="debug_ile_details"  style="border-bottom:1px solid #000000;"></div><div id="debug_ile_list" ></div>');
		},
		renderData:function(tree) {
			var t = '';


			tree.each(function (node) {
				var id = node.get('nodeid'),
					nt = node.get('nodeType'),
					c = colors[nt] || '#ffffff';
				t += '<div data-nodeid="'+ id+'" class="debug-list-button debug-depth-'+node.get('depth')+'" style="background-color:'+c+'">';
				if(nt == 'segment') {
					t += '<div class="debug-go-node" style="float:right;">go</div>';
				}
				t += id+'</div>';
			});
			this.tree = tree;
			this.$('#debug_ile_list').append(t);
			this.inspect(this.tree.root.get('nodeid'));
		},
		nodeInspect:function(node) {

			this.inspect(node.get('nodeid'));
		},
		inspect:function(nodeid, ani) {
			var m = this.tree.get(nodeid),
				args = {
					parent_nodeid: (m.is('course') ? null : m.parent.get('nodeid')),
					nodeid:m.get("nodeid"),
					args:_.map(m.toJSON(), function(value, name) {
						return {name:name, value:value};
					}),
					className:m.getFormatedNodeId('-'),
					templateId:m.getFormatedNodeId('_'),
					haschildren:m.hasChildren(),
					children:m.getChildrenNodeIds()
				};
			this.$('#debug_ile_details').html(inspectionTemplate(args));
			if(ani === true) {
				this.$el.animate({ scrollTop: 0 });
			}
		},
		choose:function(e) {
			var nodeid = this.$(e.currentTarget).data("nodeid");
			this.inspect(nodeid, true);
			e.preventDefault();
		},
		setCurrentNode:function(node) {
			if(this._currentNode) {
				node.off(null, null, this);
			}
			this._currentNode = node;
			this.nodeInspect(node, true);
			this._currentNode.on('change', this.nodeInspect);
		},
		getPanelHelp:function() {
			return 'This args panel shows all nodes in a ILE style course structure. Use this to view model data for any course node.'
		}
	}));
})();