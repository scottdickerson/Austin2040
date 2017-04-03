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