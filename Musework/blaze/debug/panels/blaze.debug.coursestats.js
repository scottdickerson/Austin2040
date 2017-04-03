(function() {
	var msgs = {
		waiting: 'Data Not Loaded Yet',
		estimate:'<strong>Note:</strong> This is a very simple estimate and may vary wildly from actual seat time. It does not take into account factors such as content difficulty, branching narrative complexity, or embedded simulations.'
	}

	var templates = {
		waiting:'<div class="debug-section">'+msgs.waiting+'</div>',
		counts:'<div><h4>Segment Counts</h4><table  id="DebugStatsCounts" class="debug-table"></table></div>',
		estimate:'<h4>Estimated Seat Time</h4><div id="DebugStatsEstimate" class="debug-section"></div><div class="debug-small-row">'+msgs.estimate+'</div>',
		activity:'<div><h4>Activites</h4><table  id="DebugStatsActivities" class="debug-table"></table></div>',
		video:'<h4>Videos</h4><div id="DebugVideoCount" class="debug-section"></div>',
		audio:'<h4>Audio</h4><div id="DebugAudioCount" class="debug-section"></div>'
	};

	Blaze.Debug.addPanel('stats',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'iledata:loaded':'render'
		},
		estimateSecondsAmount:45,
		initialize:function() {
			this.$el.html(templates.waiting);
		},
		render:function(model) {
			var counts = this.getCounts(model.nodes),
				activites = this.getActivityCount(model.nodes);
			this.$el.html(templates.counts+templates.estimate+templates.activity+templates.audio+templates.video);
			this.$('#DebugStatsCounts').html(this.makeCountHtml(counts));
			this.$('#DebugStatsEstimate').html(this.getEstimatedRunTime(counts.segment));
			this.$('#DebugStatsActivities').html(activites);
			this.$('#DebugVideoCount').html(this.getVideoCount(model.nodes));
			this.$('#DebugAudioCount').html(this.getAudioCount(model.nodes));
		},

		getCounts:function(nodes) {
			return _.countBy(nodes, function(n) {
				return n.get('nodeType');
			});
		},
		makeCountHtml:function(counts) {
			return _.reduce(['chapter', 'section','clip', 'segment', 'branch', 'quiz'], function(html, v) {
				return html + '<tr><td>'+slang.capitalizeWords(slang.pluralize(v))+'</td><td>'+(counts[v] || 0)+'</td></tr>';
			}, '');
		},
		getEstimatedRunTime:function(segCnt) {
			return this.formatTime(segCnt * this.estimateSecondsAmount);
		},
		getActivityCount:function(nodes) {
			var filter = function(m) { return (m.get('sActivityType')); };
			return _.chain(nodes).filter(filter).countBy(filter).map(function(v, k) {
				return '<tr><td>'+slang.uncamelize(k)+'</td><td>'+v+'</td></tr>';
			}).value();
		},
		formatTime:function (n) {
    		var sec_num = parseInt(n, 10),
		    	hours   = Math.floor(sec_num / 3600),
		    	minutes = Math.floor((sec_num - (hours * 3600)) / 60),
		    	time = minutes + ' minutes';

		    if (hours   > 0) {
		    	time = hours+' hours and '+time;
		    }
		    return time;
		},
		getVideoCount:function(nodes) {
			return _.filter(nodes, function(node) {
				var t = node.get('sTemplate');
				return _.isString(t) && t.match(/video/i);
			}).length;
		},
		getAudioCount:function(nodes) {
			return _.filter(nodes, function(node) {
				return node.get('bAudio');
			}).length;
		}
	}));

})();