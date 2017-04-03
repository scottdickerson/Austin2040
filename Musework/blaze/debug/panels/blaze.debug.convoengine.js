(function() {


	var templates = {
		inactive:'<h4>No current conversation detected, navigate to a conversation segment to use this panel</h4>',
		active:'<div id="debug_convo_details" style="overflow:auto; border-bottom:1px solid #000000;"></div>',
		conds:'<h4>Condition Tester</h4><div id="debug_convo_condtest" class="debug-section"><div>Test conditionals on current conversation state</div><input id="debug_cond_test" type="test"/>&nbsp;<span id="debug_cond_btn" class="debug-button">test</span><div id="debug_cond_result"></div></div><div id="debug_convo_map" class="debug-section" style="position:relative; width:480px;"></div>',
		counters:'<h4>Counters</h4><div id="debug_convo_counters" class="debug-section"></div>',
		path:'<h4>Response Path</h4><div id="debug_convo_path_human" class="debug-section"></div><div id="debug_convo_path" class="debug-section"></div>',
		events:'<h4><div id="debug_convo_clear" class="debug-button" style="float:right;">Clear</div>Event Log</h4><div id="debug_convo_log"></div>'
	};

	var fhtml = Blaze.Debug.utils.html;

	Blaze.Debug.addPanel('conversation',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'conversation:init':'registerEngine',
			'conversation:destroy':'removeEngine'
		},
		events:{
			'click #debug_cond_btn':'testCondition',
			'click #debug_convo_clear':'clearLog'
		},
		initialize:function() {
			this.setInactive();
		},
		registerEngine:function(engine) {
			this.engine = engine;
			engine.on('senario:start', this.onStart, this);
			engine.on('interaction:render', this.onInteraction, this);
			engine.on('conversation:log', this.onLog, this);
			engine.on('interaction:response:before', this.onLogResponse, this);
			engine.on('interaction:restart', this.onLogResponse, this);
			engine.on('conversation:restart', this.clearLog, this);


			this.counters = this.engine.getModule('counters').collection;
			this.counters.on('change:value', this.updateCounters, this);


			this.$el.html(templates.active + templates.path +  templates.conds + templates.counters + templates.events);
		},
		onStart:function() {
			console.log('senrio start');
			this.updateCounters();
			this.path = [];
		},
		onInteraction:function(interaction) {
			this.$('#debug_convo_details').html(this.interactionToHtml(interaction));
			this.updateLog('interaction', '<strong>interaction: '+interaction.id+'</strong>');
		},
		// make sure we are not holding on to a reference
		removeEngine:function() {

			this.engine.off('senario:start', this.onStart, this);
			this.engine.off('interaction:render', this.onInteraction, this);
			this.engine.off('conversation:log', this.onLog, this);
			this.engine.off('interaction:response:before', this.onLogResponse, this);
			this.engine.off('conversation:restart', this.clearLog, this);
			this.engine = null;
			this.counters.off('change:value', this.updateCounters, this);
			this.counters = null;
			this.$el.html(templates.inactive);


		},
		getPanelHelp:function() {
			return 'This panel is for exploring converation engine model data';
		},
		setInactive:function() {
			this.$el.html(templates.inactive);
		},
		testCondition:function() {
			var s = $('#debug_cond_test').val(),
				b = this.engine.checkCondition(s),
				html = 'tested: '+s+' <br />result: '+(b ? 'passed' : 'failed');

			this.$('#debug_cond_result').html(html);
		},
		interactionToHtml:function(interaction) {
			var html = '<h2>Interaction '+interaction.id + '</h2>';

			html += this.actorToHtml(interaction.actor);
			html += this.statementToHtml(interaction.statement);
			html += this.responsesToHtml(interaction.responses);

			return html;
		},
		responsesToHtml:function(responses) {
			var html = _.map(responses, function(r) {
				return fhtml.objectToTable('Response: '+r.id, _.pick(r, 'content', 'dialogue'));
			}).join('');

			// get locked
			var locked = this.engine.getModule('responses').collection.getResponses(Conversation.constants.LOCKED);

			html += _.map(locked, function(r) {
				return fhtml.objectToTable('Response: '+r.id + ' (locked)' , _.pick(r, 'content', 'text'));
			}).join('');

			return html;
		},
		actorToHtml:function(actor) {
			return fhtml.objectToTable('Actor', _.pick(actor, 'id', 'name', 'currentMood'));
		},
		statementToHtml:function(statement) {
			return fhtml.objectToTable('Statement', _.pick(statement, ['id', 'text']));
		},
		moodToHtml:function(mood) {

		},
		updateCounters:function(m) {
			var html = _.reduce(this.counters.toJSON(), function(s, m) {
				s += '<div>'+m.id + ' : '+m.value+'</div>';
				return s;
			}, '');
			this.$('#debug_convo_counters').html(html);
		},
		onLog:function(evt, msg) {
			this.updateLog(evt, msg);
		},
		updateLog:function(evt, msg) {
			this.$('#debug_convo_log').append('<div class="debug-small-row debug-convo-event-'+evt+'">'+msg+'</div>');
		},
		onLogResponse:function(response) {
			this.updateLog('response', '<strong>response: '+response.content+'</strong>');
			this.path.push(response);
			this.updatePath();
		},
		clearLog:function() {
			this.$('#debug_convo_log').empty();
		},
		updatePath:function() {
			var ids = _.map(this.path, function(p) {
				return p.id;
			}).join(', ');
			var intents = _.map(this.path, function(p) {
				return '<div>'+p.content+'</div>';
			}).join('');
			this.$('#debug_convo_path').html(ids);
			this.$('#debug_convo_path_human').html(intents);
		}
	}));
})();



