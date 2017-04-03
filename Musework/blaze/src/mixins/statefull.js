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