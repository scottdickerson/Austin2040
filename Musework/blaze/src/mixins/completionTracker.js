// application mixin
// requires hashBinder, globalEvents, and ILEmodel mixin
// use ones and zeros to keep suspend
Blaze.Mixer.add('completionTracker', {
	_compReqs:{},
	args:{
		completed:'bCompleted',
		activityType:'sActivityType',
		tracked:'bTrack'
	},
	onModelParsed:function(model) {
		_.each(model.nodes, this.mapReqNode, this);

		// set the events to check for segment completion
		// TODO make events configurable
		this.delegateGlobal({'node:start node:after:remove':'checkNodeCompletion'});
		Blaze.dispatcher.trigger('completion:ready', model);
	},
	// map all matched requirements and set incomplete on all nodes
	mapReqNode:function(node) {
		node.set(this.args.bCompleted, 0);
		node.set('_reqs', this.getReqList(node));
	},
	getReqList:function(node) {
		return _.reduce(this._compReqs, function(list, req) {
			if(req.matcher(node)) {
				list.push(req.name);
			}
			return list;
		}, []);
	},
	checkNodeCompletion:function(node) {
		// if we are allready complete no nead to do anything here

		if(!node.get(this.args.completed)) {
			var complete = _.every(node.get('_reqs'), function(name) {
				return this.checkRequiment(name, node);
			}, this);

			if(complete) {
				//console.log('set completed', node.get('nodeid'));
				// walk up the tree
				node.set(this.args.completed, 1);
				Blaze.dispatcher.trigger('completion:set', node);
				if(node.parent) {
					console.log('check parent', node.parent.get('nodeid'));
					this.checkNodeCompletion(node.parent);
				}
			}
		}
		Blaze.dispatcher.trigger('completion:update');
	},
	checkRequiment:function(name, node) {
		var r = this._compReqs[name];
		if(!r || !_.isFunction(r.complete)) {
			return false;
		}
		return r.complete(node);
	},
	setActivityComplete:function(node) {
		this._setSegmentComplete(node);
	},
	addCompletionReq:function(name, matcher, isComplete) {
		if(!name || !_.isFunction(matcher) || !_.isFunction(isComplete)) {
			console.warn("addCompletionRequirement requires (name[String], matcher[function] and isComplete[function]");
			return;
		}
		this._compReqs[name] = {
			name:name,
			matcher:matcher,
			complete:isComplete
		};
	}
});
