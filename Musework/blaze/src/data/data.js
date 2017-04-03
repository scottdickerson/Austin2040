// create a name space for all of the data stuff
Blaze.Data = {
	NodeTypes:{
		COURSE:"course",
		CHAPTER:"chapter",
		SECTION:"section",
		CLIP:"clip",
		SEGMENT:"segment",
		BRANCH:"branch"
	},
	// utility methods for the ile style model
	branching:{
		isBranchHead: function(id) {
			return id.lastIndexOf('_') == id.length - 1;
		},
		isInBranch: function(id) {
			// top level branch heads are not in branches
			return this.trimBranchHead(id).indexOf('_') != -1;
		},
		getBranchNumber: function(id) {
			// trim off the final underscore if this is a branch head
			id = this.trimBranchHead(id);
			return parseInt(id.substr(id.lastIndexOf('_') + 1, id.length), 10);
		},
		getBranchHeadNodeId: function(id, clipid) {
			id = this.trimBranchHead(id);
			return clipid + '/' + id.substr(0, id.lastIndexOf('_') + 1);
		},
		getBranchNodeId: function(id) {
			return this.getBranchHeadNodeId(id) + 'branch' + this.getBranchNumber(id);
		},
		// removes the last underscore on a branch head
		trimBranchHead: function(id) {
			return this.isBranchHead(id) ? id.substr(0, id.length - 1) : id;
		}
	},
	matchers:{}
};

// add basic type matchers good for iterable functions
// some convience functions
// creates a function used in tree traversal that looks to macth the nodeType attr
var makeTypeFinder = function(s) {
	return function(m) {
		return m.is(s);
	};
};