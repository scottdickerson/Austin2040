Blaze.Mixer.add('activity', {
	args:{
		completed:'bActivityCompleted',
		started:'bActivityStarted'
	},
	markStarted:function() {
		this.model.set(this.args.started, true);

		if(this.hasMixin('globalEvents')) {
			this.triggerGlobal('activity:started', this.model, this);
		}
	},
	isStarted:function() {
		return this.model.get(this.args.started);
	},
	markCompleted:function() {
		this.model.set(this.args.completed, true);

		if(this.hasMixin('globalEvents')) {
			this.triggerGlobal('activity:completed', this.model, this);
		}
	},
	isCompleted:function() {
		return this.model.get(this.args.completed);
	},
	// go to next seg
	next:function() {
		this.triggerGlobal('command:run', 'next');
	}

});