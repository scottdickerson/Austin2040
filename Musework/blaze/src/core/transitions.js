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