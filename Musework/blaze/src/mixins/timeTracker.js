// requires hashBinder, globalEvents
// application mix to provide time tracking for ILE model

Blaze.Mixer.add('timeTracker', {
	args:{
		visits:'nVisits',
		timer:'nTime'
	},
	mixinBeforeInitialize:function(options) {
		// delgate this way so we do not interfer with any globalEvents defined of the class definition
		this.delegateGlobal({
			'node:create':'onNodeCreated',
			'node:before:render':'startTimeTracking',
			'node:before:remove':'stopTimeTracking'
		});
	},
	onNodeCreated:function(node) {
		node.set({
			nVisits:0,
			nTime:0
		}, {silent:true});
	},
	startTimeTracking:function(node) {
		var visited, nodes = this.getTimeableNodes(node);

		this._startTime = new Date().getTime();

		visited = (this.nodes) ? _.difference(nodes, this.nodes) : nodes;

		_.each(visited, function(m) {
			m.incCounter(this.args.visits);
		}, this);
		this.nodes =  nodes;
	},
	stopTimeTracking:function(node) {
		var endtime =  this.getEndTime();

		_.each(this.nodes, function(m) {
			m.incCounter(this.args.timer, endtime);
		}, this);
	},
	getEndTime:function() {
		return this.getTimer() - this._startTime;
	},
	getTimer:function() {
		return new Date().getTime();
	},
	// gets all parents of the current node
	getTimeableNodes:function(node) {
		var a = node.getParents();
		// wrap node if we are at the root
		if(!_.isArray(a)) {
			return [node];
		}
		a.reverse();
		a.push(node);

		return a;
	}

});