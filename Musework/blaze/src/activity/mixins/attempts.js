// requires configurable mixin
// expects model is Blaze.Model
Blaze.Mixer.add('attempts', {
	defaultConfig:{
		nTries:0
	},
	args:{
		tries:'nTries',
		record:'nAttemptRecord'
	},
	profileReady:function() {
		this.model.set(this.args.tries, 0);
	},
	canAttempt:function() {
		return this.getAttempt() <= this.config.nTries;
	},
	setAttempted:function(record) {
		this.model.incCounter(this.args.tries);

		if(record) {
			this.recordAttempt(record);
		}
	},
	getAttempt:function() {
		return this.model.get(this.args.tries);
	},
	resetAttempts:function() {
		this.model.set(this.args.tries, 0);
		this.model.set(this.args.record, []);
	},
	recordAttempt:function(value) {
		this.model.setPush(this.args.record, value);
	},
	getAttemptRecord:function(n) {
		var r = this.model.get(this.args.record);
		if(!r) {
			return;
		}
		return (n) ? r[n] : r;
	},
	mixinBeforeRemove:function() {
		this.resetAttempts();
	}
});

