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


