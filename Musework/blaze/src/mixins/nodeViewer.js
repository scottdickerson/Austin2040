Blaze.Mixer.add('nodeViewer', {
	viewMap:{},
	mixinBeforeInitialize:function() {
		this._rendering = false;


		if(!this.viewPaths) {
			this.viewPaths = [Blaze.dna];
		}

		if(!this.cssViewClassCompiler) {
			this.cssViewClassCompiler = function(node) {
				if(_.isFunction(node.mapUp)) {
					return node.mapUp(function(n) {
						return n.getFormatedNodeId('-');
					}, true).join(' ');
				}
				return node.getFormatedNodeId('-');
			};
		}

		if(!this.viewMap) {
			this.viewMap = [];
		}

		if(!this.viewArgSearch) {
			this.viewArgSearch = function(m) {
				var a = m.attributes;
				return a.sActivityType || a.sTemplate || a.sType;
			};
		}

		_.bindAll(this, '_renderNodeComplete', '_renderNodeError', '_removeViewController', '_removeViewControllerComplete', '_removeCurrentView');
		Blaze.dispatcher.trigger('viewer:ready');
	},
	addViewPath:function(obj) {
		this.viewPaths.push(obj);
	},
	// this function is chainable
	addViewMapping:function(map) {

		if(_.isArray(map)) {

			this.viewMap.concat(map);
		}else{
			this._addViewMapping(map);
		}
		return this;
	},

	_addViewMapping:function(o) {
		if(!o || !_.isString(o.id)) {
			console.error("nodeViewer mapping must have an id");
		}
		this.viewMap[o.id] = o;

		// hook for debug panel to get view mapping
		Blaze.dispatcher.trigger('viewer:mapped', this.viewMap);
	},
	getViewMapping:function(id) {
		//console.log('viewMap', id, this.viewMap);
		return _.findWhere(this.viewMap, {id:id});
	},
	getViewMappingByArg:function(model) {
		return this.getViewMapping(this.viewArgSearch(model));
	},
	hasViewMapping:function(id) {
		return (this.viewMap[id]);
	},
	getViewController:function(controller) {
		var c;
		if(_.isString(controller)) {
			for(var i = 0; i < this.viewPaths.length; i++) {
				c = this.viewPaths[i][controller];
				if(c && _.isFunction(c)) {
					return c;
				}
			}
			return;
		}
		return controller;
	},
	getViewContainer:function(el) {
		if(el) { return _.isString(el) ?  $(el) : el; }

		if(!this.$container) {
			// lazy set the view container incase it is dynamicly created during application intialization
			if(this.defaultContainer) {
				this.$container = _.isString(this.defaultContainer) ? $(this.defaultContainer) : this.defaultContainer;
			}else{
				this.$container = $('#ContentArea');
			}
		}
		return this.$container;
	},
	isEmpty:function() {
		return (this.currentView);
	},


	renderViewNode:function(node) {
		if(!node) { return; }

		var el, template, controller, configid,
			self = this,
			id = this.viewArgSearch(node),
			mapping = this.getViewMapping(id),
			elId = node.get('nodeid'),
			elTmpId = node.getFormatedNodeId('_'),
			cls = this.cssViewClassCompiler(node);

			//console.log('MAPPING', mapping, id);

		if(mapping) {
			el = this.getViewContainer(mapping.el);

			controller = this.getViewController(mapping.controller);
			template = mapping.template;
			configid = mapping.configid;
		}else {
			// see if we have a unmapped controller
			controller = this.getViewController(id) || this.defaultController;
			template = Blaze.Templates.hasTemplate(elTmpId) ? elTmpId : this.defaultTemplate;
		}

		if(!el) {
			el = this.getViewContainer();
		}
		Blaze.dispatcher.trigger('node:before', node);

		// would like to refactor this down
		return Q.fcall(this._removeCurrentView)
			.then(function() {
				return self._beforeRenderView(node);
			}).then(function() {
				return self._createNodeView(controller, node, template, configid, el, cls);
			}).then(this._renderNodeComplete).fail(this._renderNodeError);
	},
	_removeCurrentView:function() {
		this._rendering = true;
		if(this.currentView) {
			Blaze.dispatcher.trigger('node:before:remove', this.currentView.node);
			// remove template or controller
			if(this.currentView.controller) {
				return Q.fcall(this._removeViewController).then(this._removeViewControllerComplete);
			}else{
				this._removeViewTemplate();
			}
		}
	},
	_removeViewController:function() {
		return this.currentView.controller.remove();
	},
	_removeViewControllerComplete:function() {
		this.currentView.el.removeClass(this.currentView.cls);
		Blaze.dispatcher.trigger('node:after:remove', this.currentView.node);
		this.currentView = null;
	},
	_removeViewTemplate:function() {
		this.currentView.el.empty();
		this.currentView.el.removeClass(this.currentView.cls);
		this.currentView = null;
	},
	_beforeRenderView:function(node) {
		var queue = [];
		Blaze.dispatcher.trigger('node:before:render', node, queue);
		return Q.all(queue);
	},
	_createNodeView:function(controller, node, template, configid, el, cls) {
		var view;
		if(controller) {

			view = new controller({model:node, configid:configid});
			el.append(view .el);


		}else if(template) {
			el.html(Blaze.Templates.render(template, node.toJSON()));
		}

		el.addClass(cls);
		this._setCurrentView(node, view, template, cls, el);
		if(view) {
			return Q.all(view.render() || []);
		}
	},
	_setCurrentView:function(node, controller, template, cls, el) {
		this.currentView = {
			node:node,
			controller:controller,
			template:template,
			cls:cls,
			el:el
		};
	},
	_renderNodeComplete:function() {
		var node = this.currentView.node;
		this._rendering = false;
		Blaze.dispatcher.trigger('node:after:render', node);
		Blaze.dispatcher.trigger('node:start', node);
	},
	isRenderingNode:function() {
		return this._rendering;
	},
	_renderNodeError:function(error) {
		console.error(error, error.stack);
	}
 });