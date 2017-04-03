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