Blaze.Mixer.add('timed', {
	// implement this in your class
	// requires configurable mixin
	onTimeReset:function() {},
	onTimeUp:function() {},
	onTimerTick:function() {},
	mixinBeforeInitialize:function() {
		_.bindAll(this, '_tickCountdown');
		this._timerActive = false;
	},
	mixinAfterInitialize:function() {

	},
	defaultConfig:{
		bCountdown:false,
		nTimer:30
	},
	startCountdown:function() {
		if(!this.config.bCountdown) {
			return;
		}
		this.resetCountdown();

		// close enough method for timing
		if(!this._timerActive) {
			this._timerActive = true;
			this._tickNext();
		}
	},
	stopCountdown:function() {
		this._timerActive = false;
	},
	resetCountdown:function() {
		this.model.set('timer', this.config.nTimer);
		this.onTimeReset();
	},
	_tickCountdown:function() {
		var t = this.model.decCounter('timer');
		if(t === 0) {
			this.stopCountdown();
			this.trigger('timer:out', t);
			this.onTimeUp(t);
		}else{
			this.onTimerTick(t);
			this.trigger('timer:tick', t);
			this._tickNext();
		}
	},
	_tickNext:function() {
		this._timeout = setTimeout(this._tickCountdown, 1000);
	},
	mixinBeforeRemove:function() {
		if(this._timeout) {
			clearTimeout(this._timeout);
		}
		this._timeout = null;
	}
});