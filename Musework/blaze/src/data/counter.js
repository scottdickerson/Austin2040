Blaze.Data.Counter = Blaze.Model.extend({
	initialize:function(options) {
		this.id = this.id || this.cid;
	},
	defaults:{
		'count':0,
		'step':1,
		'dir':1
	},
	inc:function(n) {
		this.setCount((n || this.get('step')) * this.get('dir'));

	},
	dec:function(n) {
		this.setCount((n || this.get('step')) * (this.get('dir') * -1));
	},
	saveToModel:function(m) {
		m.set(this.id+"Count", this.get('count'));
	},
	restoreFromModel:function(m) {
		var n = m.get(this.id+"Count");

	},
	setCount:function(n) {
		if(_.isNumber(n)) {
			this.set('count', n);
		}
	}

});