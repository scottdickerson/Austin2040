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
