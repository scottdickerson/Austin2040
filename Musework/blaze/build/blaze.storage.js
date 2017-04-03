/*! this is a compiled file do not change blaze.data - v0.1.2 - 2015-03-18 */
(function() {
Blaze.Storage = {};
//TODO validators for get
//TODO async support, should use promises
Blaze.Storage.Adaptor = function(options) {
	this.suppressErrors = false;
	this.actions = {};
	this.initialize(options || {});
	if(!this.id) {
		this.id = _.uniqueId('storageAdptor_');
	}
	if(this.isAvailable()) {
		Blaze.dispatcher.trigger('storage:ready', this.id, this);
	}

};
_.extend(Blaze.Storage.Adaptor.prototype, {
	// any set up
	initialize:function() {},
	// is not async by default
	isAsync:function() {
		return false;
	},
	// null for any
	gettable:null,
	settable:null,
	// implement you check for the storage method here
	//  will be called before and set or get
	isAvailable:function() {
		return false;
	},
	// this is the api for Blaze Storage
	get:function() { return false; },
	set:function() { return false; },

	// actions are registered so they are exposed for debug panels
	action:function(name, value) {
		if(!this.isAvailable()) {
			return false;
		}
		var a = this.actions[name];
		if(a) {
			return a.call(this, value);
		}else{
			this.logError('has no action'+name);
			return false;
		}
	},
	addAction:function(name, f) {
		if(!_.isFunction(f)) {
			console.error(this.id, 'storage action '+name+' must be a function');
		}
		this.actions[name] = f;
	},
	getActionList:function() {
		return _.keys(this.actions);
	},
	// error hadling
	onError:function() {
		this.logError('unknown error');
	},
	logError:function(msg) {

		if(this.suppressErrors) { return; }
		Blaze.dispatcher.trigger('storage:error', this.id,  msg);
	}
});
Blaze.Storage.Adaptor.extend = Blaze._extend;

// TODO AICC edition adaptor
Blaze.Storage.AiccAdaptor = Blaze.Storage.Adaptor.extend({
	attemptLimit:7,
	cmiMapping:{

	},
	initialize:function(options) {
		this.id =  options.id || 'aicc';

	}
});

// TODO AICC HACP adaptor
Blaze.Storage.Scorm2004_2Adaptor = Blaze.Storage.Adaptor.extend({
	attemptLimit:7,
	cmiMapping:{

	},
	initialize:function(options) {
		this.id =  options.id || 'aicc_hap';

	}
});

Blaze.Storage.LocalStorageAdapter = Blaze.Storage.Adaptor.extend({
	initialize:function(options) {
		this.id = options.id || 'Local Storage';
		this.setActions();
		this._isAvailable = (window.store);
	},
	isAvailable:function() {
		return this._isAvailable;
	},
	set:function(name, value) {
		if(!this.isAvailable()) { return false; }
		return store.set(name, value);
	},
	get:function(name) {
		if(!this.isAvailable()) { return false; }
		return store.get(name);
	},
	setActions:function() {
		this.addAction('remove', function(name) {
			if(!this.isAvailable()) { return false; }
			store.remove(name);
		});
		this.addAction('clear', function() {
			if(!this.isAvailable()) { return false; }
			store.clear();
		});
	}
});



// adaptor for scorm 1.2 lms to be used with Blaze.
Blaze.Storage.Scorm12Adaptor = Blaze.Storage.Adaptor.extend({
	attemptLimit:7,
	cmiMapping:{
		'bookmark':'cmi.suspend_data',
		'student_id':'cmi.core.student_id',
		'student_name':'cmi.core.student_name',
		'status':'cmi.core.lesson_status',
		'mode':'cmi.core.lesson_mode',
		'score':'cmi.core.score.raw',
		'score_min':'cmi.core.score.max',
		'score_max':'cmi.core.score.max',
		'time':'cmi.core.total_time',
		'interaction_count':'cmi.interactions._count'
	},
	initialize:function(options) {
		// atempt to get the api
		this.id = options.id || 'scorm_1_2';
		var api = this._getAPI(),
			keys = _.keys(this.cmiMapping);

		this.gettable = keys;
		this.settable = _.without(keys, 'student_name', 'student_id', 'interaction_count');
		this.setActions();

		if(api) {
			this.api  = api;
			// check by string some older LMS's return this value as a string
			if(this.api.LMSInitialize("").toString() != "true") {
				this.onError();
				return false;
			}
			if(this.get('status') == 'not attempted') {
				this.set('status', 'incomplete');
			}
			this._restoreInteractionMap();
		}




	},
	setActions:function() {
		this.addAction('commit', function() {
			var result = this.api.LMSCommit("");
			this.onError();
			return result;
		});
		this.addAction('finish', function() {
			var result = this.api.LMSFinish("");
			this.onError();
			return result;
		});
		this.addAction('pass', function() {
			return this.set("status", "passed");
		});
		this.addAction('fail', function() {
			return this.set("status", "failed");
		});
		this.addAction('complete', function() {
			if (this.get("mode") == "browse"){
				return false;
			}
			// if completion has allready been set
			if(this.checkComplete()) {
				return true;
			}
			return this.set("status","completed");
		});
		this.addAction('isComplete', function() {
			return this.checkComplete();
		});
		this.addAction('start', function() {
			if(this.checkComplete()) {
				return true;
			}
			return this.set("status", "incomplete");
		});

		// adding interaction mapping support
		// takes an JSON object with accepted values
		this.addAction('interaction', function(iobj) {
			if(!iobj.id) { return false; } // id is required for an interaction

			var results = [], n = this._getInteractionN(iobj.id);

			this._setInteractionData(n, 'id', iobj.id);

			if( iobj.time ) {
				results.push(this._setInteractionData(n, 'time', iobj.time));
				this.onError('cmi.interaction.'+n+'.time');
			}
			if( iobj.type && _.contains(["true-false", "choice", "fill-in", "matching", "performance", "sequencing", "likert", "numeric"], iobj.type)) {
				results.push(this._setInteractionData(n, 'type', iobj.type));
				this.onError('cmi.interaction.'+n+'.type');
			}
			// at this time we do not need to support multiple responses
			if( iobj.pattern ) {
				results.push(this._setInteractionData(n, 'correct_responses.0.pattern', iobj.pattern ));
				this.onError('cmi.interaction.'+n+'.correct_responses.0.pattern');
			}
			// probably never use this
			if( iobj.weighting ) {
				results.push(this._setInteractionData(n, 'weighting', iobj.weighting ));
				this.onError('cmi.interaction.'+n+'.weighting');
			}
			if(  iobj.response ) {
				results.push(this._setInteractionData(n, 'student_response', iobj.response ));
				this.onError('cmi.interaction.'+n+'.student_response');
			}
			if( iobj.result ) {
				results.push(this._setInteractionData(n, 'result', iobj.result ));
				this.onError('cmi.interaction.'+n+'.result');
			}
			return !_.contains(results, 'false') && !_.contains(results, false) ;
		});
	},
	checkComplete:function() {
		return _.contains(["completed", "passed", "failed"], this.get("status"));
	},
	// on error gets called to check for error
	onError:function(cmi) {
		var code = this.api.LMSGetLastError().toString();
		// return if the lms says no error
		if (code == "0") { return; }
		if(!cmi) {
			cmi = '';
		}

		// log the error
		code = cmi+' ('+code+')' + this.api.LMSGetErrorString(code) + ' - ' + this.api.LMSGetDiagnostic(code);
		this.logError(code);
	},
	_getInteractionN:function(id) {
		console.log('interaction map', id);
		console.log('_getInteractionN', id);
		var n = this.get('interaction_count'),
			mapped = _.findWhere(this.interaction_map, {
				id:id
			});

		console.log('_getInteractionN mapped', mapped);
		if(mapped) {
			n = mapped.n;
		}else{
			this.interaction_map.push({
				id:id,
				n:n
			});
		}

		return n;
	},
	_setInteractionData:function(n, cmi, value) {
		console.log('_setInteractionData', n, cmi, value);
		var result = this.api.LMSSetValue('cmi.interactions.'+n+'.'+cmi, value);
		this.onError();
		return result;
	},
	// will need to make sure we have a current interaction map if we are returning
	_restoreInteractionMap:function() {
		var id, a = [], n = parseInt(this.get('interaction_count'));

		console.log('_restoreInteractionMap get interaction count', n);
		if(_.isNumber(n)) {
			_.each(_.range(n), function(inum) {
				id = this.get('cmi.interactions.'+inum+'.id');

				a.push({
					id:id,
					n:inum
				});

			}, this);
		}

		this.interaction_map = a;

	},
	// do we have connection
	isAvailable:function() {
		var b = (this.api);
		if(!b) {
			this.logError('could not find an SCORM API');
		}
		return b;
	},
	get:function(name) {
		if(!this.isAvailable()) { return; }
		var result, cmi = this.cmiMapping[name];
		if(!cmi) {
			this.logError(name+' is not a valid scorm 1.2 variable');
			return;
		}
		result = this.api.LMSGetValue(cmi);
		this.onError();
		return result;
	},
	set:function(name, value) {
		if(!this.isAvailable()) { return; }
		var result, cmi = this.cmiMapping[name];
		if(!cmi) {
			this.logError(name+' is not a valid scorm 1.2 variable');
			return;
		}
		result = this.api.LMSSetValue(cmi, value);
		this.onError();
		return result;
	},
	// utilites
	// api location

	_findAPI:function(win) {
		var tries = 0;
		while (!(win.API) && !_.isNull(win.parent) && (win.parent != win)) {
			tries++;
			if (tries > this.attemptLimit)  {
				this.logError("SCORM API too deeply nested.");
				return null;
			}
			win = win.parent;
		}
		return win.API;
	},
	_getAPI:function() {
		var api = this._findAPI(window);
		if (!(api) && !_.isNull(window.opener) && !_.isUndefined(window.opener)) {
			try{
				api = this._findAPI(window.opener);
			}catch(e) {} // this is for a cross domain issue when viewing from build server link in chrome
		}
		if (!api)	{
			this.logError("could not find an SCORM API");
			return null;
		}
		return api;
	}
});

// TODO SCORM 2004 2nd edition adaptor
Blaze.Storage.Scorm2004_2Adaptor = Blaze.Storage.Adaptor.extend({
	attemptLimit:7,
	cmiMapping:{

	},
	initialize:function(options) {
		this.id =  options.id || 'scorm_20004_2';

	}
});

// TODO Tin Can Adaptor
})();