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