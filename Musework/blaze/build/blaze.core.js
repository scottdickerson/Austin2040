/*! this is a compiled file do not change blaze.core - v0.1.2 - 2015-03-18 */
(function() {
// Blaze name space
var Blaze = {
	dispatcher:_.clone(Backbone.Events),
	// a loader for xml, json, and  html
	// returns a q promise
	loadAsset:function(url, type, callback) {
		var deferred = Q.defer();

		$.ajax({
			url: url,
			dataType: type,
			success: function(asset) {
				if(_.isFunction(callback)) {
					callback(asset);
				}
				Blaze.dispatcher.trigger('asset:loaded', asset, url);
				deferred.resolve(asset);
			},
			error: function(jqxhr, status, err) {
				console.log(jqxhr, status, err);
				Blaze.dispatcher.trigger('load:error', 'url', err);
				deferred.reject(new Error(err));
			}
		});
		return deferred.promise;
	},
	// global storage for reg exs
	// to expose for testing
	regx:{
		stripNonNumeric:/^[0-9]+$/,
		count_:/[^_]/g,
		splitCommaTrim:/\s*,\s*/
	},
	// a namespace for all classes for the application
	dna:{}
};

// add blaze to the global scope
window.Blaze = Blaze;

// add our mixin system to classes this function should not be used directly
Blaze._extend = function(protoProps, classProps) {
	if(this == Blaze) {
		console.error("you cannot extend Blaze in this way");
	}
	var cls = Backbone.Model.extend.call(this, protoProps, classProps);
	var mixins = cls.prototype.mixins;

	// make sure we have a hasMixins function
	if(!cls.prototype.isMixed) {
		Blaze.Mixer.makeMixable(cls);
	}

	if (mixins && cls.prototype.hasOwnProperty('mixins')) {
		Blaze.Mixer.mix(cls, mixins);
	}
	return cls;
};

/**
 *
 */

Blaze.Mixer = {
	_mixins:{},
	add:function(id, obj) {
		var err;
		if(!id || !_.isString(id) || !_.isObject(obj)) { err = "Mixer.add requires a id and a object definition";}
		if(this.has(id)) { err = "Mixer.add duplicate mixin "+id+" will not be added"; }
		if(err) { throw err; }
		this._mixins[id] = obj;
	},
	has:function(id) {
		return _.has(this._mixins, id);
	},
	get:function(id) {
		return this._mixins[id];
	},
	mix:function(obj, mixins) {
		if(_.isString(mixins)) {
			this._applyMixin(obj, mixins);
		}
		if(_.isArray(mixins)) {
			_.each(mixins, function(id) {
				this._applyMixin(obj, id);
			}, this);
		}
	},
	_applyMixin:function(obj, id) {
		if(!this.has(id)) {
			throw "cannot mixin "+id+" not found";
		}
		var m = this.get(id);
		if(_.isFunction(obj))  {
			Cocktail.mixin(obj, m);
		}else{
			_.extend(obj, m);
		}
	},
	makeMixable:function(cls) {
		var obj = _.isFunction(cls) ? cls.prototype : cls;
		return _.extend(obj, Blaze.Mixer.Mixable);
	}
};

// this should be added to all classes that are mixable
Blaze.Mixer.Mixable = {
	isMixed:true,
	hasMixin:function(ids) {
		if(!this.mixins || !_.isArray(this.mixins)) {
			return false;
		}
		if(_.isString(ids)) {
			return _.contains(this.mixins, ids);
		}
		if(_.isArray(ids)) {
			return _.intersection(this.mixins, ids).length == ids.length;
		}
		return false;
	}
};


// no triggering of events
var silent = { silent: true };
// this is for enumerated collapsing args into arrays
// looks for arg[n]name
var processPattern = function(p, i) {
	return p.replace('[n]', i);
};
var getPatternReducer = function(m) {
	return function(o, p) {
		o[processPattern(p, '')] = m.get([processPattern(p, o.i)]);
		return o;
	};
};

Blaze.Model = Backbone.Model.extend({
	constructor:function(options) {
		this.mixinBeforeInitialize();

		this.serializer = options && _.isArray(options.serializer) ? options.serializer : [];

		Backbone.Model.apply(this, arguments);
		this.mixinAfterInitialize();
	},
	// these should not be used except in mixins
	mixinBeforeInitialize:function() {},
	mixinAfterInitialize:function() {},
	// takes a  array of patterns and returns a array of objects
	// pattern is like 'sChoice[n]Text'
	// use to get enumerated args
	// very usefull for templating
	collapseArgs: function(pattern, startcount) {
		// pattern must be an array
		if (!_.isArray(pattern)) {
			pattern = [pattern];
		}

		var i = _.isNumber(startcount) ? startcount : 0,
			ret = [],
			attrs = this.attributes,
			allFound = false,
			first = pattern[0],
			reducer = getPatternReducer(this);

		while (!allFound) {
			if (!this.get(processPattern(first, i))) {
				allFound = true;
			} else {
				ret.push(_.reduce(pattern, reducer, {i: i}));
				i++;
			}
		}
		return ret;
	},
	groupForDisplay:function(args, shuffle, uid, baseAttrName) {
		var c = this.collapseArgs(args);

		if(shuffle) {
			c = _.shuffle(c);
		}
		Blaze.utils.addUniqueIds(c, uid);
		Blaze.utils.addNumbering(c);

		if(baseAttrName) {
			_.each(c, function(m) {
				this.set(baseAttrName+m.i+'Id', m.id);
			}, this);
		}
		return c;

	},
	getOr:function(name, v) {
		return this.has(name) ? this.get(name) : v;
	},
	incCounter:function(id, amt) {
		var n = this.get(id);
		if(!n) { n = 0; }
		n = n + (amt || 1);
		this.set(id, n);
		return n;
	},
	decCounter:function(id, amt) {
		var n = this.get(id);
		if(!n) { n = 0; }
		n = n - (amt || 1);
		this.set(id, n);
		return n;
	},
	// seting an array
	setPush:function(id, value, unique) {
		var a = this.get(id);

		if(!a) {
			a = [value];
		}else{
			if(unique === true && _.contains(a, value)) { return; }
			a.push(unique);
		}
		this.set(id, a);
	},
	setShift:function(id) {

	},
	setSerializer:function(serializer) {
		this.serializer = serializer;
	},
	serialize:function() {
		return _.map(this.serializer, function(attr) {
			return this.get(attr);
		}, this);

	},
	deserialize:function(data) {
		if(!this.serializer || !_.isArray(data)) {
			return;
		}
		_.each(this.serializer, function(attr, i) {
			this.set(attr, data[i], {silent:true});
		}, this);
	},
	toString:function() {
		return '(model) ' +(this.id || this.cid);
	}
});
Blaze.Model.extend = Blaze._extend;

Blaze.Collection = Backbone.Collection.extend({
	model:Blaze.Model
});
Blaze.Collection.extend = Blaze._extend;


var _adaptors = {};

var defaultAdaptor = function(node) {
	return _.isFunction(node.toJSON) ? node.toJSON() : node;
};
Blaze.Adaptors = {
	add:function(id, func) {
		_adaptors[id] = func;
	},
	convert:function(id, node, scope) {
		return this.get(id).call(scope, node);
	},
	get:function(id) {
		if(!id) { return defaultAdaptor; }
		return _adaptors[id] || defaultAdaptor;
	}
};


// Blaze View
// adds mixin hooks for before and after initialize
Blaze.View = Backbone.View.extend({
	// these should not be used except in mixins
	mixinBeforeInitialize:function() {},
	mixinAfterInitialize:function() {},
	mixinBeforeRemove:function() {},
	mixinBeforeRender:function() {},

	// call this in your ender method if you use any mixins that have have after render hooks such as transitionable
	mixinAfterRender:function(queue) {  return queue; },
	constructor:function(options) {
		this.mixinBeforeInitialize(options);
		Backbone.View.apply(this, arguments);
		this.mixinAfterInitialize(options);
	},
	beforeRemove:function() {},
	// allows for a async remove
	// so you can run transitions or other things
	remove:function() {
		var self = this,
			promises = [];

		this.beforeRemove(promises);
		this.mixinBeforeRemove(promises);

		return Q.all(promises).then(function() {
			Backbone.View.prototype.remove.apply(self, arguments);
		});
	},
	// extend to do model processing before templating
	// never pass a raw model to Blaze.templates since we add all the helpers on to the data object
	getTemplateData:function(adaptorId) {
		// if we do not have a model just return a empty object
		var m = {};
		if(this.model) {
			m = Blaze.Adaptors.convert(adaptorId, this.model, this);
		}
		// if we have a config object add it onto the model json
		if(this.config) {
			m.config = this.config;
		}
		return m;
	},
	// get current target from event
	getTarget:function(evt) {
		return $(evt.currentTarget);
	},
	getTargetData:function(evt, attr) {
		return this.getTarget(evt).data(attr);
	},
	getTargetId:function(evt) {
		return this.getTarget(evt).attr('id');
	},

	// a way to keep track of args
	// note that templates may require args that are just pass through
	args:{},
	getArg:function(name) {
		return this.model.get(this.args[name] || name);
	}
});
Blaze.Mixer.makeMixable(Blaze.View);
Blaze.View.extend = Blaze._extend;


// Blaze.Alerts
// type: Singleton/Namespace
//
// listens for  global events
// alert:spawn - alerttype, data, callback
//
// sends global events:
// alert:complete - return_value
//
// uses promises fo completion
//
// example:
//
//
//
//
//
//
var nAlert = 0;

Blaze.Alerts = {
	_alerts:{},
	_queue:[],
	_default:null,
	register:function(id, func, isQueable, isDefault) {
		this._alerts[id] = {
			id:id,
			que:(isQueable === true),
			func:func
		};
		if(isDefault || !(this._default)) {
			this.setDefault(id);
		}
	},
	spawn:function(id, data, callback) {
		var args, a = this.get(id);
		if(!a || !_.isFunction(a.func)) {
			Blaze.dispatcher.trigger('alert:error', id+' alert does not exist');
			return;
		}
		if(a.que) {
			args = _.toArray(arguments);
			args[0] = a;
			this._queue.push(args);

			if(this._queue.length == 1) {
				this._next();
			}
		}else{
			this._process(id, data, callback);
		}
	},
	_process:function(a, data, callback) {
		var deferred;

		deferred = Q.defer();

		// run alert function
		a.func(deferred, data);

		deferred.promise.then(function(value) {
			if(_.isFunction(callback)) {
				callback(value);
			}
			Blaze.dispatcher.trigger('alert:complete', a.id, value);
		}).fail(function (error) {
			console.error(error, error.stack);
		});

		return deferred.promise;
	},
	_next:function() {
		if(this._queue.length < 1) {
			Blaze.dispatcher.trigger('alert:empty');
		}else{
			this._process.apply(this, this._queue[0]).then(function(value) {
				Blaze.Alerts._queue.shift();
				Blaze.Alerts._next();
			});
		}
	},
	get:function(id) {
		return this._alerts[id] || this._alerts[this._default];
	},
	has:function(id) {
		return _.contains(_.keys(this._alerts), id);
	},
	setDefault:function(id) {
		this._default = id;
	}
};
Blaze.dispatcher.on('alert:spawn', Blaze.Alerts.spawn, Blaze.Alerts);


// application extends from Backbone.Router
Blaze.Application = Backbone.Router.extend({
	// overwrite the constructor so that initialize is still available
	constructor:function(options) {
		if(!options) { options = {}; }

		// store app on the Blaze Name Space. use App name if you need multiple apps
		Blaze[(options.appName || "app")] = this;

		this.mixinBeforeInitialize(options);
		Backbone.Router.apply(this, arguments);
		this.mixinAfterInitialize(options);
	},
	// these should not be used except in mixins
	mixinBeforeInitialize:function() {},
	mixinAfterInitialize:function() {},
	setDocumentTitle:function(s) {
		document.title = s;
	}
});

Blaze.Application.extend = Blaze._extend;





Blaze.Command = function(id, cmd, shortcut, scope) {
	if(!_.isFunction(cmd)) {
		throw new Error('Blaze.Command requires a command function');
	}
	this.id = id;
	this.scope = scope || Blaze.app;
	this.cmd = cmd;
	this.once = false;
	this.shortcut = shortcut;
	if(shortcut) {
		Blaze.utils.keybind('cmd_'+id, shortcut, function() {
			Blaze.Commands.run(id);
		});
	}
};
_.extend(Blaze.Command.prototype, {
	run:function() {
		Blaze.dispatcher.trigger('command:before', this.id);
		this.cmd.apply(this.scope, arguments);
		Blaze.dispatcher.trigger('command:after', this.id);
	},
	// make sure we are not holding a referce to a scope so we sill garbage collect
	// remove keyboard binding
	release:function() {
		Blaze.utils.keyunbind('cmd_'+this.id);
		// if(this.shortcut) {
		// $(document.body).unbind('keydown.cmd_'+this.id);
		// }
		this.scope = null;
	},
	lock:function() {
		this._locked = true;
	},
	unlock:function() {
		this._locked = false;
	},
	isLocked:function() {
		return (this._locked);
	}
});

Blaze.Commands = {
	_commands:{},
	_overrides:{},
	add:function(id, cmd, shortcut, scope) {
		if(this.has(id)) {
			console.warn("command cannot be added, try removing the current command "+id+" first.");
			return;
		}
		this._commands[id] = this.create(id, cmd, shortcut, scope);
		return this;
	},
	// this command will only be run once
	addOnce:function(id, cmd, shortcut, scope) {
		var cmdOnce = function() {
			cmd.apply(this, arguments);
			Blaze.Commands.remove(id);
		};
		this.add(id, cmdOnce, shortcut, scope);
		return this;
	},
	create:function(id, cmd, shortcut, scope) {
		return new Blaze.Command(id, cmd, shortcut, scope);
	},
	has:function(id) {
		return _.has(this._commands, id);
	},
	get:function(id) {
		return this._commands[id];
	},
	run:function(id) {
		var cmd = this.hasOverride(id) ? this.getOverride(id) : this.get(id);
		if(cmd && _.isFunction(cmd.run) && !cmd.isLocked()) {
			cmd.run.apply(cmd,  _.toArray(arguments).slice(1));
		}
		return this;
	},
	remove:function(id) {
		if(!this.has(id)) { return; }

		this._commands[id].release();
		delete this._commands[id];
		return this;
	},
	clear:function() {
		_.invoke(this._commands, 'release');
		this._commands = {};
		return this;
	},
	override:function(id, cmd, scope) {
		this._overrides[id] = this.create(id, cmd, scope);
		return this;
	},
	overrideOnce:function(id, cmd, scope) {
		var cmdOnce = function() {
			cmd.apply(this, arguments);
			Blaze.Commands.removeOverride(id);
		};
		this._commands[id] = this.override(id, cmdOnce, scope);
		return this;
	},
	removeOveride:function(id) {
		if(!this.hasOverride(id)) { return; }

		this._overrides[id].release();
		delete this._overrides[id];
		return this;
	},
	hasOverride:function(id) {
		return _.has(this._overrides, id);
	},
	getOverride:function(id) {
		return (this._overrides[id]);
	},
	clearOverrides:function() {
		_.invoke(this._overrides, 'release');
		this._overrides = {};
		return this;
	},
	getCommandList:function() {
		return {
			commands:this.getCommandData(this._commands),
			overrides:this.getCommandData(this._overrides)
		};
	},
	getCommandData:function(list) {
		return _.map(list, function(cmd) {
			return {
				id:cmd.id,
				shortcut:(cmd.shortcut || '')
			};
		});
	},
	lock:function(id) {
		if(this.has(id)) {
			this.get(id).lock();
		}
		if(this.hasOverride(id)) {
			this.getOverride(id).lock();
		}
	},
	unlock:function(id) {
		if(this.has(id)) {
			this.get(id).unlock();
		}
		if(this.hasOverride(id)) {
			this.getOverride(id).unlock();
		}
	}
};
// listen for command:run
Blaze.dispatcher.on('command:run', function(id) {
	Blaze.Commands.run(id, _.toArray(arguments).slice(1));
});
Blaze.dispatcher.on('command:lock', function(id) {
	Blaze.Commands.lock(id);
});
Blaze.dispatcher.on('command:unlock', function(id) {
	Blaze.Commands.unlock(id);
});

Blaze.Configs = (function() {
	// private collection config should not be able to be rewritten
	var _profiles = new Backbone.Collection();

	// change from flash ile ALL configs must be wrapped in a profile
	var _parse = function(xml) {
		_.each($(xml).find('profile'), function(profile) {
			var p = $(profile),
				args = _.reduce(p.find('config'), function(args, config) {
					var c = $(config);
					args[c.attr('name')] = _.processAttr(c.attr('value'));
					return args;
				}, {id:p.attr("name")});

			_profiles.add(args);
		});

		Blaze.dispatcher.trigger('configs:loaded');
	};

	return {

		load:function(url) {
			// returns promise
			return Blaze.loadAsset(url+'.xml', 'xml', _parse);
		},
		// adds a profile object, duplicates are ignored
		add:function(id, args, overwrite) {
			var cfg = _profiles.get(id);
			args.id = id;

			if(cfg) {
				if(overwrite === true) {
					cfg.clear({silent:true});
					cfg.set(args);
				}
			}else{
				_profiles.add(new Backbone.Model(args));
			}
		},
		// returns a full profile json or a single arg
		get:function(profile, attr) {
			var p = _profiles.get(profile);
			if(!p) { return (attr) ? null : {}; } // no profile return empty config object or null attr
			if(attr) { return p.get(attr); } // get a single attr
			return p.toJSON(); // return profile json
		},
		// check config equality
		is:function(profile, attr, expected) {
			return this.get(profile, attr) == expected;
		},
		has:function(id) {
			return (this.get(profile));
		},
		getAll:function() {
			return _profiles.toJSON();
		}
	};
})();

// labels is a key value store for global text
Blaze.dna.LabelCollection = Backbone.Model.extend({
	notifyMissing:true,
	load:function(url) {
		return Blaze.loadAsset(url+'.xml', 'xml', _.bind(this._parse, this));
	},
	_parse:function(xml) {
		this.set(_.reduce(_.getXmlNodes(_.getXmlNodes(xml, 'labels'), 'label'), function(o, lbl) {
			var l = $(lbl);
			o[l.attr('id')] = l.text();
			return o;
		}, {}), silent);
		Blaze.dispatcher.trigger('labels:loaded', this);
	},
	add:function(id, label) {
		var o = {};
		o[id] = label;
		this.set(o, silent);
	},
	get:function(id) {
		var s = Backbone.Model.prototype.get.call(this, id);
		if(!s) {
			return this.notifyMissing ? "Missing Label "+id : '';
		}
		return s;
	}
});
Blaze.Labels =  new Blaze.dna.LabelCollection();

var autoMatch = function() { return true; };


// a simple attempt at a
Blaze.Parser = function(matcher, parse) {
	if(!_.isFunction(parse)) {
		console.warn("parser initialized without parser function, a pass through function will be applied");
		parse = function(a) { return _.toArray(arguments); };
	}

	// string matcher
	if (_.isString(matcher)) {
		this.match = (matcher === '') ? autoMatch : function(attr) { return attr == matcher; };
	} else if (_.isRegExp(matcher)) {
		this.match = function(attr) { return matcher.test(attr); };
	}else if(_.isFunction(matcher)) {
		this.match = matcher;
	}else if(_.isObject(matcher)) {
		// alow for where clauses
		this.match = function(attr)  {
			if(_.isArray(attr)) {
				return (_.findWhere(attr, matcher));
			}
			if(_.isObject(attr)){
				// make sure attr is wraped
				return (_.findWhere([attr], matcher));
			}
			return false;
		};
	}else{
		this.match = autoMatch;
	}

	this.parse = parse;
};

var _parsers = {};
Blaze.Parsers = {
	add:function(id, matcher, parse) {
		_parsers[id] = new Blaze.Parser(matcher, parse);
	},
	// parse without matching
	parse:function(id, attr) {
		var parser;
		if(_.isArray(id)) {
			id = _.find(id, function(pid) {
				var p = _parsers[pid];
				if(!p) { return false; }
				return p.match(attr);
			});
			parser = _parsers[id];
		}else{
			parser = _parsers[id];

			// failed match do not parse
			if(parser && !parser.match(attr)) {
				console.error("failed parsing ", id);
				return;
			}
		}

		if(parser) {
			return parser.parse.apply(this, _.toArray(arguments).slice(2));
		}else{
			console.error('could not find parser '+id);
		}
	}
};


// query object pattern inspired by
// http://journal.crushlovely.com/post/89978453593/7-patterns-to-refactor-javascript-applications-query

// in progress

Blaze.QueryObject = function(model, scope) {
	this.model = model;
	this.scope = scope;
};

_.extend(Blaze.QueryObject.prototype, {
	// returns a promise
	run:function() {
		this.deferred = Q.defer();
		return this.deferred;
	},
	result: function( err, value ) {
		if ( err ) {
			this.deferred.reject( err );
		} else {
			this.deferred.resolve( value );
		}
	}
});




Blaze.Resource = Blaze.Model.extend({

});

Blaze.ResourcesCollection = Backbone.Collection.extend({
	model:Blaze.Resource,
	load:function(url) {
		return Blaze.loadAsset(url+'.xml', 'xml', _.bind(this._parse, this));
	},
	_parse:function(data) {
		console.log("Loaded reources", data);
		var a = [];
		_.each($(data).find('resource'), function(r) {
			var o =_.getXmlAttrs(r);
			if(!o.id || slang.isBlank(o.id)) {
				o.id = _.uniqueId('resources_');
			}
			a.push(o);
		});
		this.add(a);
	}
});

Blaze.Resources = new Blaze.ResourcesCollection();

// Blaze Global Template Manager
// loads and parses templates from Dom or external html file
// uses mustache templating
// adds stored helper functions and  partial templates onto every render call data object
// you should always call a toJSON() on models instead of passing the the model._attributes object
Blaze.Templates = {
	notifyMissing:true,
	// buckets
	_templates:{},
	_partials:{},
	_helpers:{},
	// default jquery selectors to get templates
	selectors:{
		template:'script[type*=mustache]',
		partial:'script[type*=partial]'
	},
	// returns a promise
	load:function(url, tselector, pselector) {
		return Blaze.loadAsset(url+".html", 'html', function(html) {
			// wrap in a div so find will work with top level script tags
			Blaze.Templates._parseHTML($('<div>'+html+'</div>'), tselector, pselector);
		});
	},
	// loads whole html as a single template
	// returns a promise
	loadSingleTemplate:function(id, url) {
		return Blaze.loadAsset(url+'.html', 'html', function(html) {
			Blaze.Templates.addTemplate(id, html);
		});
	},
	// this will get templates from current html page (non async action)
	getFromDom:function(tselector, pselector) {
		this._parseHTML($('body'), tselector, pselector);
	},
	addTemplate:function(id, template) {
		this._templates[id] = template;
	},
	addPartial:function(id, partial) {
		this._partials[id] = partial;
	},
	addHelper:function(id, func) {
		if(_.isFunction(func)) {
			this._helpers[id] = function() { return func; };
		}
	},
	getPartial:function(id) {
		return this._partials[id];
	},
	getTemplate:function(id) {
		return this._templates[id];
	},
	getHelper:function(id) {
		return this._helpers[id];
	},
	hasPartial:function(id) {
		return _.has(this._partials, id);
	},
	hasTemplate:function(id) {
		return _.has(this._templates, id);
	},
	// takes an array and returns the first one it finds or a defualt if no match is found
	hasMatch:function(a) {
		var t = Blaze.Templates._templates;
		return _.find(a, function(tmp) {
			if(!_.isString(tmp)) {
				return false;
			}
			return !_.isUndefined(t[tmp]);
		});
	},
	hasHelper:function(id) {
		return _.has(this._helpers, id);
	},
	// render a template with helpers and partials
	render:function(id, data, partials) {
		if(!this.hasTemplate(id)) {
			// only retrun a missing template message if Blaze.Templates.notifyMissing is set to true
			return (this.notifyMissing) ? 'Missing Template '+id : '';
		}
		return this.renderRaw(this.getTemplate(id), data, partials);
	},
	// allow a non stored template to be rendered
	renderRaw:function(template, data, partials) {
		return Mustache.render(template, this._addHelpers(data) , this._addPartials(partials));
	},
	_parseHTML:function(html, tselector, pselector) {
		var tsel = tselector || this.selectors.template,
			psel = pselector || this.selectors.partial;

		_.extend(this._templates, this._extractor(html, tsel));
		_.extend(this._partials, this._extractor(html, psel));
	},
	// gets templates or partials out of dom node, expects node to be wrapped jquery
	_extractor:function(node, selector) {
		return _.reduce($(selector, node), function(collector, el) {
			el = $(el);
			collector[el.attr('id')] = el.html();
			return collector;
		}, {});
	},
	// these add partials and helpers onto data at render time
	// note if a key exsits on the data object which is also a helper the data opject will be used
	_addHelpers:function(data) {
		if(!data) { return this._helpers; }
		return _.extend({}, this._helpers, data);
	},
	_addPartials:function(partials) {
		if(!partials) { return this._partials; }
		return  _.extend({}, this._partials, partials);
	},
	// hook for debug panel
	getAvailable:function() {
		return {
			templates:_.keys(this._templates),
			partials:_.keys(this._partials),
			helpers:_.keys(this._helpers)
		};
	}
};

// allows calling a partial from inside a template
// partial name can be dynamic
// use: {{#partial}}partial_name{{/partial}} or  {{#partial}}{{partialNameArg}}{{/partial}}
Blaze.Templates.addHelper("partial", function (id, render) {
    return render('{{>' + slang.trim(render(id)) + '}}');
});
// allows for nesting of templates
// template name can be dynamic
// {{#template}}template_name{{/template}} or  {{#template}}{{templateNameArg}}{{/teamplate}}
Blaze.Templates.addHelper("template", function (id, render) {
    return render(Blaze.getTemplate(render(slang.trim(id))));
});

// allows for getting a label in a template
// adding a helper for geting labels in templates
// use: {{#label}}labelid{{/label}} or {{#label}}{{label_arg}}{{/label}}
Blaze.Templates.addHelper("label", function(id, render) {
	// remove white space from label id and get label
	return Blaze.Labels.get(render(slang.trim(id)));
});

// a global store for transitions
Blaze.Transitions = {
	_trans:{},
	add:function(id, func) {
		this._trans[id] = func;
		return this;
	},
	// will return a promise no matter what
	//
	run:function(tran, el, view) {
		var scope = view || this,
			t = _.isFunction(tran) ? tran : this._trans[tran],
			args = _.toArray(arguments).slice(1);

		if(!_.isFunction(t)) {
			t = function() {};
		}
		return Q.fcall(function() {
			return t.apply(scope, args);
		}).fail(function(error) {
			console.error('transition failed', error, error.stack);
		});
	},
	has:function(id) {
		if(!id) { return false; }
		return (this._trans[id]);
	}
	// TODO runSeq
	// TODO runAll
};

Blaze.Tree = function(config) {
	this.nodes = [];
	this.node_indexes = {};
	this._config(config);
	this.initialize();

};
_.extend(Blaze.Tree.prototype, {
	_config:function() {},
	initialize:function() {},
	onAdded:function(node) {},
	add:function(child, parent) {
		var nodeid, depth = 0, index = 0;
		if(!child) {
			console.error('tried to add null node.');
			return;
		}
		if(parent) {
			depth = parent.get('depth') + 1;
			parent.addNode(child);
		}else if(!this.root) {
			// first node added will be the root, any added after the root will be a unatached node
			child.setIndex(0);
			this.root = child;
		}
		//set depth
		child.setDepth(depth);

		// unique node id is required
		nodeid = child.get('nodeid');
		if(!nodeid) {
			nodeid = _.uniqueId('node_');
			child.set({nodeid:nodeid}, {silent:true});
		}
		if(this.node_indexes[nodeid]) {
			console.error('Duplicate node id: ' + nodeid + 'node not added.');
			return;
		}
		child.tree = this;
		// lookup
		this.node_indexes[nodeid] = this.nodes.push(child) - 1;
		this.onAdded(child);
	},
	get:function(nodeid) {
		return this.nodes[this.node_indexes[nodeid]];
	},
	toString:function() {
		return 'tree ('+this.nodes+')';
	}
});

var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'reduceRight',  'find', 'detect', 'filter', 'select', 'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke', 'max', 'min', 'toArray', 'size', 'first', 'initial', 'rest', 'last', 'without', 'indexOf', 'lastIndexOf', 'sample'];

//Mix in each Underscore method as a proxy to BlazeTree#models.
_.each(methods, function(method) {
	Blaze.Tree.prototype[method] = function() {
		var args = _.toArray(arguments);
		args.unshift(this.nodes);
		return _[method].apply(_, args);
	};
});

Blaze.Tree.extend = Blaze._extend;

Blaze.regx.forwardSlashes = /\//g;

// abstract base class for Ile tree model
Blaze.TreeNode = Blaze.Model.extend({
	defaults: { nodeType: 'node'},
	// checks the node type
	initialize:function() {
		this.nodes = new Backbone.Collection();

		// make sure we have a unique nodeid
		if(!this.get('nodeid')) {
			this.set('nodeid', _.uniqueId('node'));
		}
	},
	is: function(nodetype) {
		var t = this.get('nodeType');
		if(_.isArray(nodetype)) {
			return _.contains(nodetype, t);
		}
		return t == nodetype;
	},
	count: function(predicate) {
		return _.isFunction(predicate) ? this.nodes.filter(predicate).length :  this.nodes.length;
	},
	// wiring
	setParent: function(parent) {
		this.parent = parent;
	},
	addNode: function(node) {
		node.setParent(this);
		node.setIndex(this.count());
		this.nodes.add(node);
		this.onAdded(node);
	},
	onAdded:function() {},
	getFormatedNodeId:function(del) {
		return this.get('nodeid').replace(Blaze.regx.forwardSlashes , del || '-');
	},
	setIndex:function(n) {
		this.set({ index:n }, silent);
	},
	setDepth:function(n) {
		this.set({ depth: n }, silent);
	},
	at:function(n) {
		return this.nodes.at(n);
	},
	nextSibling:function() {
		return this.parent.at(this.get('index')+1);
	},
	prevSibling:function() {
		return this.parent.at(this.get('index')-1);
	},
/*	getNode: function(id) {
		return this.nodes.get(id);
	}*/

	// traversal methods
	firstChild: function() {
		return this.nodes.at(0);
	},
	lastChild: function() {
		return this.nodes.at(this.nodes.length - 1);
	},
	hasChildren: function() {
		return this.nodes.length > 0;
	},
	getChild: function(id) {
		return this.nodes.get(id);
	},
	findChild: function(func, isChild) {
		if(isChild && func(this)) {
			return this;
		}else{
			var result,
				m = this.nodes.models,
				l = m.length;

			for(var i = 0; i < l; i++) {
				result = m[i].findChild(func, true);
				if(result) {
					return result;
				}
			}
		}
	},
	// TODO get all children that passes test
	findChildren: function(func, a) {
		//console.debug("Find children", this.id, func(this));
		if(!a) {
			a = [];
		}else if(func(this)) {
			a.push(this);
		}
		if(this.nodes.length) {
			this.nodes.each(function(n) {
				n.findChildren(func, a);
			});
		}
		return a;
	},
	// recursive parent finder
	findParent: function(func) {
		if (func(this)) {
			return this;
		}
		if (!this.parent) {
			return null;
		}
		return this.parent.findParent(func);
	},
	// each applied to this node then all children nodes
	each: function(func) {
		func(this);
		this.nodes.each(function(m) {
			m.each(func);
		});
	},
	getChildrenNodeIds: function() {
		return this.nodes.map(function(m) {
			return m.get('nodeid');
		});
	},
	getParents:function() {
		var a = [], found = false, node = this.parent;

		while(node) {
			a.push(node);
			node = node.parent;
		}
		return a;
	},
	// TODO reduce function that goes up in depth
	reduceUp: function(func, val, bThis) {
		var a = this.getParents();
		if(bThis) {
			a.unshift(this);
		}
		return _.reduce(a, func, val);
	},
	mapUp:function(func, bThis) {
		var a = this.getParents();
		if(bThis) { a.unshift(this); }
		return _.map(a, func);
	},
	// TODO reduce funtion down through the children nodes
	reduceDown: function(func) {

	},
	toString:function() {
		return this.get('nodeType') + ':'+this.get('nodeid');
	}
});

Blaze.TreeNode.extend = Blaze._extend;


/*
Blaze.Serializer = function(id, predicate, serialize, deserialize) {
	this.id = id;
	this._predicate = predicate;
	this._serialize = serialize;
	this._deserialize = deserialize;
};

_.extend(Blaze.Serializer.prototype, {
	match:function(node) {
		return this._predicate(node);
	},
	serialize:function(node) {
		return this._serialize(node);
	},
	deserialize:function(node, args) {
		node.set(this._deserialize(args));
	}
});


Blaze.TreeSerializer = function(tree) {
	this.tree = tree;
	this.serializers = [];
};
_.extend(Blaze.TreeSerializer.prototype, {
	prepend:function(serializer) {
		this.serializers.unshift(serializer);
	},
	append:function(serializer) {
		this.serializers.push(serializer);
	},
	make:function(id, predicate, serialize, deserialize, front) {
		var ser = new Blaze.Serializer(id, predicate, serialize, deserialize);
		if(front) {
			this.prepend(ser);
		}else{
			this.append(ser);
		}
		return ser;
	},
	serialize:function() {
		var self = this,
			data = this.tree.map(function(node, a) {
			var ser = self._find(node);
			return (ser) ? ser.serialize(node) : [];
		});

		return JSON.stringify(data);
	},
	_find:function(node) {
		return _.find(this.serializers, function(s) {
			return s.match(node);
		});
	},
	deserialize:function(data) {
		var self = this,
			a = JSON.parse(data);

		if(!_.isArray(a)) {
			console.warn("no date in deserialize data array");
			return;
		}

		this.tree.each(function(s, i) {
			var ser = self._find(node),
				d = a[i];

			if(d) {
				ser.deserialize(d);
			}
		});
	}
});

Blaze.TreeSerializer.extend = Blaze._extend;

*/

Blaze.utils = {
	// takes an array of objects and adds a number
	// a - array of objects
	// style -numeric (1, 2, 3), human (1st, 2nd, 3rd), lower (a, b, c), upper (A, B, C) will defualt to numeric
	addNumbering:function(a, style) {
		if(!_.isArray(a)) { return a; }

		var letters = 'abcdefghijklmnopqrstuvwxyz';
		_.each(a, function(o, i) {
			o.letter = letters.charAt(i);
			o.num = i + 1;
			o.human = slang.humanize(o.num);
		});
		return a;
	},
	// takes an array of objects and adds a unique id to each one
	// a - array of objects
	// prefix - id prefix defualts to 'blaze_'
	// name - the name of the attr - defualts to id
	addUniqueIds:function(a, prefix, name) {
		if(!_.isArray(a)) { return a; }
		if(!prefix) { prefix = 'blaze_'; }
		if(!name) { name = 'id'; }
		_.each(a, function(o) {
			o[name] = _.uniqueId(prefix);
		});
		return a;
	},
	//
	keybind:function(id, shortcut, f) {
		var html = $('html'),
			func = (window.jwerty && !html.hasClass('ie7') && !html.hasClass('ie8')) ?  window.jwerty.event(shortcut, f) : function() {
				console.log("keybinding without jwery not implemented for old IE yet");
			};
		$(document.body).bind('keydown.'+id, func);
	},
	keyunbind:function(id) {
		$(document.body).unbind('.'+id);
	},
	// utility for adding Backbone Events to any class prototype
	addEvents:function(clz) {
		_.extend(clz.prototype, Backbone.Events);
	},
	// use this when you want to check aginst a Backbone/Blaze.model or regular object return a empty object if no match is made
	getModelAttrs:function(model) {
		if(!model) { return {}; }
		return model.attributes || model;
	},
	// replaces forward slashes with underscores
	replaceSlashes:function(s, del) {
		return s.replace(Blaze.regx.forwardSlashes , del || '-');
	},
	wrapPromise:function(f) {
		var def = Q.defer();
		f(function() { def.resolve(); });
		return def.promise;
	}
};
})();