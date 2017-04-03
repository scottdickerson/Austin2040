/*! this is a compiled file do not change blaze.mixin - v0.1.2 - 2015-03-18 */
(function() {
// mixin animator
//
// requires: none
// usage:
//
//
//
/*
May want to implement fps
var fps = 15;
function draw() {
    setTimeout(function() {
        requestAnimationFrame(draw);
    }, 1000 / fps);
}
 */
Blaze.Mixer.add('animator', {
	mixinBeforeInitialize:function() {
		this._animating = false;
		_.bindAll(this , '_animate');
	},
	startAnimation:function() {
		if(this._animating) { return; }
		this._animating = true;
		this._animate();
	},
	//stop animation if we explicitly return false from onAnimationFrame
	_animate:function(time) {
		if(this.onAnimationFrame(time) === false) {
			console.log('returned false');
			this.stopAnimation();
			return;
		}
		this.af = requestAnimationFrame(this._animate);
	},
	stopAnimation:function() {
		if(this.af) {
			cancelAnimationFrame(this.af);
		}
		this.af = null;
		this._animating = false;
	},
	mixinBeforeRemove:function() {
		this.stopAnimation();
	},
	isAninmating:function() {
		return (this._animating);
	},
	onAnimationFrame:function(time) {} // make sure this function is there
});

Blaze.Mixer.add('assetLoader', {
	assets:{

	},
	mixinAfterInitialize:function(options) {
		if(options.assets) {
			this.assets = options.assets;
		}
		return options;
	},
	loadAssets:function() {
		var a = [];

		_.each(this.assets.configs, function(url) {
			a.push(Blaze.Configs.load(url));
		});

		_.each(this.assets.labels, function(url) {
			a.push(Blaze.Labels.load(url));
		});

		_.each(this.assets.templates, function(url) {
			a.push(Blaze.Templates.load(url));
		});

		_.each(this.assets.resources, function(url) {
			a.push(Blaze.Resources.load(url));
		});

		return Q.all(a).fail(this.onAssetLoadError);
	},
	// call this in the fail call of the intialization
	onAssetLoadError:function(error) {
		console.error(error, error.stack);
	}
});


// view mixin for
// TODO: add canvas convenience methods
Blaze.Mixer.add('canvas', {
	mixinBeforeInitialize:function(options) {
		options = options || {};

		// have to do this since tagName is a string and will not be mixed in
		this._makeCanvas();

		this.ctx = this.el.getContext("2d");

		this.setCanvasWidth(this.w || options.w || 100);
		this.setCanvasHeight(this.h || options.h || 100);
	},
	_makeCanvas:function() {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<canvas>').attr(attrs);
        this.setElement($el, false);
	},
	setCanvasWidth:function(n) {
		this.w = n;
		this.el.width = n;
	},
	setCanvasHeight:function(n) {
		this.h = n;
		this.el.height = n;
	},
	render:function() {

	}
});

// requires hasbind binder and a collection
Blaze.Mixer.add('collectionEvents', {
	mixinAfterInitialize:function(options) {
		var me = options && options.collectionEvents ?  options.collectionEvents : this.collectionEvents;
		if(me) {
			this.delegateCollection(me);
		}
	},
	delegateCollection:function(hash) {
		// allow for a function -> object or an object
		if(_.isFunction(hash)) {
			hash = hash();
		}
		if(_.isObject(hash)) {
			this.hashbind(this.collection, hash);
		}
	},
	undelegateCollection:function() {
		this.stopListening(this.collection);
	}
});

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

// application mixin
// requires hashBinder, globalEvents, and ILEmodel mixin
// use ones and zeros to keep suspend
Blaze.Mixer.add('completionTracker', {
	_compReqs:{},
	args:{
		completed:'bCompleted',
		activityType:'sActivityType',
		tracked:'bTrack'
	},
	onModelParsed:function(model) {
		_.each(model.nodes, this.mapReqNode, this);

		// set the events to check for segment completion
		// TODO make events configurable
		this.delegateGlobal({'node:start node:after:remove':'checkNodeCompletion'});
		Blaze.dispatcher.trigger('completion:ready', model);
	},
	// map all matched requirements and set incomplete on all nodes
	mapReqNode:function(node) {
		node.set(this.args.bCompleted, 0);
		node.set('_reqs', this.getReqList(node));
	},
	getReqList:function(node) {
		return _.reduce(this._compReqs, function(list, req) {
			if(req.matcher(node)) {
				list.push(req.name);
			}
			return list;
		}, []);
	},
	checkNodeCompletion:function(node) {
		// if we are allready complete no nead to do anything here

		if(!node.get(this.args.completed)) {
			var complete = _.every(node.get('_reqs'), function(name) {
				return this.checkRequiment(name, node);
			}, this);

			if(complete) {
				//console.log('set completed', node.get('nodeid'));
				// walk up the tree
				node.set(this.args.completed, 1);
				Blaze.dispatcher.trigger('completion:set', node);
				if(node.parent) {
					console.log('check parent', node.parent.get('nodeid'));
					this.checkNodeCompletion(node.parent);
				}
			}
		}
		Blaze.dispatcher.trigger('completion:update');
	},
	checkRequiment:function(name, node) {
		var r = this._compReqs[name];
		if(!r || !_.isFunction(r.complete)) {
			return false;
		}
		return r.complete(node);
	},
	setActivityComplete:function(node) {
		this._setSegmentComplete(node);
	},
	addCompletionReq:function(name, matcher, isComplete) {
		if(!name || !_.isFunction(matcher) || !_.isFunction(isComplete)) {
			console.warn("addCompletionRequirement requires (name[String], matcher[function] and isComplete[function]");
			return;
		}
		this._compReqs[name] = {
			name:name,
			matcher:matcher,
			complete:isComplete
		};
	}
});


// Mixin - configurable
//
// requires: none
// usage:
//
//
//
Blaze.Mixer.add('configurable', {
	// set a config profile on a class or or per instance
	// do this before initialize so we have config set when initialize is called
	mixinBeforeInitialize:function(options) {
		var id;

		// safegaurd
		if(!options) { options = {}; }

		this.config = _.extend({}, this.defaultConfig || {});

		if(options.model && _.isFunction(options.model.get)) {
			id = options.model.get('sProfile');
		}
		if(!id) {
			id = options && _.isString(options.configid) ? options.configid : this.configid;
		}
		if(id) {
			this.getBlazeConfig(id);

			// loop through args and add any node level overrides to the config
		}
		if(this.model) {
			this.overrideConfigFromModel();
		}
	},
	// do this after model and el intialization
	mixinAfterInitialize:function() {
		// if this is a view add the styling hooks
		// add a a profile-(id or 'default') and any class names on the sClassName
		if(this.$el) {
			classNames = 'profile-'+(_.isString(this.config.id) ? this.config.id : 'default');
			if(this.config.sClassName) {
				classNames += ' '+this.config.sClassName;
			}
			this.$el.addClass(classNames);
		}
		this.profileReady();
	},

	setConfigs:function(config) {
		this.config = _.extend({}, this.config, config);
	},
	configis:function(name, expected) {
		return this.config[name] == expected;
	},
	getBlazeConfig:function(id) {
		this.setConfigs(Blaze.Configs.get(id));
	},
	overrideConfigFromModel:function() {
		_each(_.keys(this.config), function(key) {
			var m = this.model.get(key);
			if(_.isUndefined(m)) {
				this.config[key] = _.processAttr(m);
			}
		}, this);
	},

	// use this function to do things profile is set
	profileReady:function() {}
});



// mixin - globalEvents
// allows binding to the global events dispatcher
// requires: hashbinder
// usage:
//
//
//
//
Blaze.Mixer.add('globalEvents', {
	mixinAfterInitialize:function(options) {
		// set global events on class or or per instance
		var ge = options && options.globalEvents ?  options.globalEvents : this.globalEvents;
		if(ge) {
			this.delegateGlobal(ge);
		}
	},
	delegateGlobal:function(hash) {
		// allow for a function -> object or an object
		if(_.isFunction(hash)) {
			hash = hash();
		}
		if(_.isObject(hash)) {
			this.hashbind(Blaze.dispatcher, hash);
		}
	},
	// set suppressLocalEvents to disable sending a global event through the object itself
	triggerGlobal:function() {
		if(!this.suppressLocalEvents) {
			this.trigger.apply(this, arguments);
		}
		Blaze.dispatcher.trigger.apply(Blaze.dispatcher, arguments);
	}
});

// mixin - hasViews
// to manage views
// requires: hashBinder
// usage:
//
//
//
//
Blaze.Mixer.add('hasViews', {
	mixinBeforeInitialize:function() {
		this._views = {};
	},
	mixinAfterInitialize:function() {
		// if this is a view auto call createViews
		if(this.$el) {
			this.createViews();
		}
	},
	// this will be called on intialize once _views has been created
	// this is just here to make sure one is present
	createViews:function() {},
	// container can be string or jquery object
	addView:function(id, view, container, events) {
		this._views[id] = view;
		if(_.isObject(events)) {
			this.hashbind(view, events);
		}
		if(container) {
			if(_.isString(container)) {
				// search global if we do not have a scoped jquery
				((this.$) ? this.$(container) : $(container)).append(view.el);
			}else if(_.isJquery(container)) {
				container.append(view.el);
			}
		}
		return view;
	},
	removeView:function(id) {
		var v = this._views[id];
		v.stopListening();
		v.remove();
		delete this._views[id];
		return this;
	},
	hasView:function(id) {
		return _.has(this._views, id);
	},
	getView:function(id) {
		return this._views[id];
	}
});

// mixin hashbinder
// bind any object that has Backbone.Events uses listenTo so use stopListening to unbind
// requires: none
// usage:
//
//
//
//
Blaze.Mixer.add('hashBinder', {
	hashbind:function(obj, events) {
        var self = this;

        if(obj && _.isFunction(obj.listenTo) && _.isObject(events)) {
            _.each(events, function(name, evt) {
                var func = self[name];
                if (_.isFunction(func)) {
                    self.listenTo(obj, evt, _.bind(func, self));
                }
            });
        }
        return this;
	}
});

// a super simple knockout.js style attribute binding
// this is to allow simple binding from the template
// use full for updating pass through args
//
Blaze.Mixer.add('htmlBinder', {
	// make sure to pass through promise queue
	mixinAfterRender:function(queue) {
		this.applyBindings();
		return queue;
	},
	applyBindings:function() {
		// get all elements that require binding
		var elms = this.$('[data-bind]');

		_.each(elms, function(elm) {
			// get bindable elements
			var el = $(elm),
				attr = el.data('bind'),
				evt = 'change:'+attr;

			// no need to clean this up since stopListening is called on beforeRemove
			this.listenTo(this.model, evt, function(m, v) {
				el.html(v);
			});
		}, this);
	}
});

// handles serializing the suspend strings from an ile model

Blaze.Mixer.add('ileSerializer', {
	// define this in your app to
	serializers:{},
	onModelParsed:function(model) {
		_.each(model.nodes, this._setNodeSerializer, this);
	},
	serialize:function() {

	},
	deserialize:function() {

	},
	getLookup:function() {
		// order of serializer lookup
		// node id
		// profile id
		// activity type
		// template type
		// segment type
		// default
		return _.chain(node.attributes)
				.pick('nodeid', 'sProfile', 'sActivityType', 'sTemplate', 'nodeType')
				.toArray()
				.compact()
				.value()
				.push('all');
	},
	_setNodeSerializer:function() {
		var ser = _.find(this.getLookup() , function(id) {
			return (id) ? (this.serializers[id]) : false;
		}, this);

		node.setSerializer(this.serializers[ser] || []);
	},
	addNodeSerializer:function(id, arr) {
		if(!_.isString(id) || !_.isArray(arr)) {
			return;
		}
		this.serializers[id] = arr;
	}
});

// requires hashbinder and a model
Blaze.Mixer.add('modelEvents', {
	mixinAfterInitialize:function(options) {
		var me = options && options.modelEvents ?  options.modelEvents : this.modelEvents;
		if(me) {
			this.delegateModel(me);
		}
	},
	delegateModel:function(hash) {
		// allow for a function -> object or an object
		if(_.isFunction(hash)) {
			hash = hash();
		}
		if(_.isObject(hash)) {
			this.hashbind(this.model, hash);
		}
	},
	undelegateModel:function() {
		this.stopListening(this.model);
	},
	mixinBeforeRemove:function() {
		this.undelegateModel();
	}
});

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

// mixin - positionable
//
// requires: none
// usage:
//
//
//
Blaze.Mixer.add('positionable', {
	position:function(x, y) {
		this.$el.css({top:(x || 0)+'px', left:(y || 0)+'px'});
		return this;
	},
	getVector:function() {
		var pos = this.$el.position();
		return [pos.left, pos.top];
	},
	offsetBy:function(x, y) {
		var pos = this.offsetBy();
		this.position(pos[0] + x, pos[1] + y);
	},
	right:function(x) {
		this.$el.css({right:(x || 0)+'px'});
		return this;
	},
	left:function(x) {
		this.$el.css({left:(x || 0)+'px'});
		return this;
	},
	top:function(y) {
		this.$el.css({top:(y || 0)+'px'});
		return this;
	},
	bottom:function(y) {
		this.$el.css({bottom:(y || 0)+'px'});
		return this;
	}
});

Blaze.Mixer.add('shortcuts', {
	mixinAfterInitialize:function() {
		this._kid = _.uniqueId('kid');

		if(this.shortcuts) {
			this.delegateShortcuts(n);
		}
	},
	addShortcut:function(evt, func) {
		if (_.isString(evt) && _.isFunction(func)) {
			this._hasShortcuts = true;
			Blaze.utils.keybind(this._kid, evt, _.bind(func, this));
		}
	},
	delegateShortcuts:function(events) {
		var self = this, f;
		if(_.isObject(events)) {
            _.each(events, function(name, evt) {
				self.addShortcut(evt, self[name]);
            });
        }
	},
	// you may have to call this
	// if not on a view class
	mixinBeforeRemove:function() {
		this.removeShortcuts();
	},
	removeShortcuts:function() {
		Blaze.utils.keyunbind(this._kid);
		this._hasShortcuts = false;
	},
	hasShortcuts:function() {
		return (this._hasShortcuts);
	}
});

// mixin - statefull
// super simple finite state machine
// requires: none
// usage:
//
//
//
//
//
Blaze.Mixer.add('statefull', {
	mixinAfterInitialize:function(options) {
		var startState = (options && _.isString(options.state)) ? options.state : this.defaultState;
		if(startState) { this.state(startState); }
	},
	// states are shared across instances
	states:{},
	// gets or sets state
	state:function(id) {
		var s, args =  _.toArray(arguments);
		if(!id) { return this._state; }
		if(id == this._state || !this.states[id]) { return; }
		if(this._state) {
			s = this.states[this._state];
			if(_.isFunction(s.exit)) {
				s.exit.apply(this, args);
				this.trigger("state:exit", this._state);

			}
			if(this.$el) {
				this.$el.removeClass(this._state+'-state');
			}
		}
		s = this.states[id];
		if(_.isFunction(s.enter)) {
			args[0] = this._state;
			s.enter.apply(this, args);
			this.trigger("state:enter", id);
			if(this.$el) {
				this.$el.addClass(id+'-state');
			}

			// auto play any transitions if the element is transitionable and has a transition defined for this state
			if(this.hasMixin('transitionable') && this.transitions[id]) {
				this.transition(this.transitions[id]);
			}
		}
		this._state = id;

	},
	// check current state
	// allows for first matched in an array of state ids
	isState:function(id) {
		if(_.isArray(id)) {
			return _.contains(id, this._state);
		}
		return this._state == id;
	},
	hasState:function(id) {
		var s = this.states[id];
		return (!_.isNull(s) && !_.isUndefined(s));
	}
});

// mixin - templated
//
// restrictions: Blaze.View
// requires: none
// usage:
//
//
//
Blaze.Mixer.add('templated', {
	// process a stored template and return it
	getTemplate:function(templateid, json, partials) {
		return Blaze.Templates.render(templateid, json, partials);
	},
	// process a raw template and return it
	getRawTemplate:function(template, json, partials) {
		return Blaze.Templates.renderRaw(template, json, partials);
	},
	// apply template to current view element
	template:function(templateid, json, partials) {
		var t = this.getTemplate(templateid, json, partials);
		this.$el.html(t);
	},
	templateRaw:function(template, json, partials) {
		var t = this.getRawTemplate(template, json, partials);
		this.$el.html(t);
	},
	// apply template to a area of the current view
	subTemplate:function(sel, templateid, json, partials) {
		this.$(sel).html(this.getTemplate(templateid, json, partials));
	},
	// order of search
	// nodeid with underscores in place of forward slashes
	// config sTemplate
	// arg sTemplate
	// on view class templateId set
	// or a no Match
	getTemplateIdOr:function(nomatch) {
		var a = [];
		if(this.model && _.isFunction(this.model.getFormatedNodeId)) {
			a.push(this.model.getFormatedNodeId('_'));
			a.push(this.model.get('sTemplate'));
		}
		// if we have the configurable
		if(this.config) {
			a.push(this.config.sTemplate);
		}
		if(this.templateId) {
			a.push(this.templateId);
		}
		return Blaze.Templates.hasMatch(_.compact(a)) || nomatch;
	}
});


// requires hashBinder, globalEvents
// application mix to provide time tracking for ILE model

Blaze.Mixer.add('timeTracker', {
	args:{
		visits:'nVisits',
		timer:'nTime'
	},
	mixinBeforeInitialize:function(options) {
		// delgate this way so we do not interfer with any globalEvents defined of the class definition
		this.delegateGlobal({
			'node:create':'onNodeCreated',
			'node:before:render':'startTimeTracking',
			'node:before:remove':'stopTimeTracking'
		});
	},
	onNodeCreated:function(node) {
		node.set({
			nVisits:0,
			nTime:0
		}, {silent:true});
	},
	startTimeTracking:function(node) {
		var visited, nodes = this.getTimeableNodes(node);

		this._startTime = new Date().getTime();

		visited = (this.nodes) ? _.difference(nodes, this.nodes) : nodes;

		_.each(visited, function(m) {
			m.incCounter(this.args.visits);
		}, this);
		this.nodes =  nodes;
	},
	stopTimeTracking:function(node) {
		var endtime =  this.getEndTime();

		_.each(this.nodes, function(m) {
			m.incCounter(this.args.timer, endtime);
		}, this);
	},
	getEndTime:function() {
		return this.getTimer() - this._startTime;
	},
	getTimer:function() {
		return new Date().getTime();
	},
	// gets all parents of the current node
	getTimeableNodes:function(node) {
		var a = node.getParents();
		// wrap node if we are at the root
		if(!_.isArray(a)) {
			return [node];
		}
		a.reverse();
		a.push(node);

		return a;
	}

});

// mixin - toggleEnabled
//
// requires:
// usage:
//
//
//
Blaze.Mixer.add('toggleEnabled', {
	mixinBeforeInitialize:function() {
		this._enabled = true;
	},
	enable:function() {
		this._enabled = true;
		this.trigger("enabled");
		if(this.$el) {
			this.$el.removeClass('disabled').addClass('enabled');
		}
		this.onEnabled();
	},
	disable:function() {
		this._enabled = false;
		this.trigger("disabled");
		if(this.$el) {
			this.$el.removeClass('enabled').addClass('disabled');
		}
		this.onDisabled();
	},
	toggleEnabled:function(b) {
		if(!_.isBoolean(b)) {
			b = !this._enabled;
		}
		this.setEnabled(b);
	},
	onEnabled:function() {},
	onDisabled:function() {},
	setEnabled:function(b) {
		if(b) {
			this.enable();
		}else{
			this.disable();
		}
	},
	isEnabled:function() {
		return this._enabled;
	}
});

// mixin - toggleVisible
//
// requires:
// usage:
//
//
//
//
Blaze.Mixer.add('toggleVisible', {
	mixinBeforeInitialize:function() {
		this._visible = true;
	},
	hide:function() {
		this._visible = false;
		if(this.useVisibleProp) {
			this.$el.css({visibility:"hidden"});
		} else {
			this.$el.hide();
		}
		this.onHide();
		this.trigger("hide");
	},
	show:function() {
		this._visible = true;
		if(this.useVisibleProp) {
			this.$el.css({visibility:"visible"});
		}else{
			this.$el.show();
		}
		this.onShow();
		this.trigger("show");
	},
	onShow:function() {},
	onHide:function() {},
	toggleVisible:function() {
		this.setVisible(!this._visible);
	},
	setVisible:function(b) {
		if(b) {
			this.show();
		}else{
			this.hide();
		}
	},
	isVisible:function() {
		return this._visible;
	}
});

Blaze.Mixer.add('transitionable', {

	transitions:{},
	autoTransition:true,
	// make sure to include this mixin after configurable to make sure that your configs are set before
	mixinBeforeInitialize:function() {
		// copy any transitions on the class over to a local var
		this._transitions = _.extend({}, this.transitions);
	},
	// if we have config add transitions
	profileReady:function() {
		_.extend(this._transitions, _.reduce(this.config, function(o, v, k) {
			if(k.indexOf('sTransition') != -1) {
				var name = k.slice(k.indexOf('sTransition')+11);
				// remove an underscore if thre is on between sTransition and the name
				if(name.charAt(0) == '_') {
					name = name.slice(1);
				}
				o[name] = v;
			}
			return o;
		}, {}));
	},
	configTransitions:function() {
		var config = this.config;

		return _.chain(config).filter(function(v, k) {
			return (k.indexOf('sTransition') != -1);
		}).reduce(function(o, v, k) {
			var name = k.slice(k.indexOf('sTransition')+11);
			// remove an underscore if thre is on between sTransition and the name
			if(name.charAt(0) == '_') {
				name = name.slice(1);
			}
			o[name] = v;

			return o;
		}, {}).value();
	},
	// you will need to call this after render
	mixinAfterRender:function(promises) {
		var p;
		if(this._transitions.intro && this.autoTransition) {
			p = this.transition(this._transitions.intro);
			if(promises) {
				promises.push(p);
			}
		}
	},
	// we use a promise so that
	mixinBeforeRemove:function(promises) {
		var p;
		if(this._transitions.outro && this.autoTransition) {
			p = this.transition(this._transitions.outro);
			if(promises) {
				promises.push(p);
			}
		}
	},
	// always return a promise
	transition:function(trans, options) {
		if(_.isString(trans) && this.transitions[trans]) {
			trans = this.transitions[trans];
		}
		return Blaze.Transitions.run(trans, this.$el, this, options);
	},
	transitionOr:function(id, func, options) {
		var t = this.getTransition(id);

		if(t) {
			return this.transition(t, options);
		}else{
			return Q.fcall(_.bind(func, this), options);
		}
	},
	hasTransition:function(id) {
		return (this.getTransition(id));
	},
	getTransition:function(id) {
		return this._transitions[id];
	},
	// if you have mixin stateful, will just run transition if not available
	// returns a promise
	transitionToState:function(trans, state) {
		var self = this, t = this.transition(trans);
		if(this.hasMixin('stateful')) {
			t.then(function() {
				self.state(state);
			});
		}
		return t;
	}
});
})();