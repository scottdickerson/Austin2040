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