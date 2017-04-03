(function() {
	// list and commands and shortcuts and command run button
	//
	//

	var filter = function(m) { return (m.get('sActivityType')); };
	var template = '<h4>Activity Count</h4><div><table  id="DebugActivityCount" class="debug-table"></table></div><h4>Activity Answer Key</h4><div id="DebugActivityKey"></div>';
	Blaze.Debug.addPanel('activity',  Blaze.Debug.Panel.extend({
		initialize:function() {
			this.addDefualtKeys();
			this.render();
		},
		globalEvents:{
			'iledata:loaded':'onData',
			'node:start':'highlight'
		},
		events:{
			'click .js-seg-jump':'goSeg'
		},
		render:function() {
			this.$el.html(template);
		},
		goSeg:function(e) {
			Blaze.dispatcher.trigger('node:request', this.$(e.currentTarget).text());
			e.preventDefault();
		},
		getActivityCount:function(nodes) {
			return _.chain(Blaze.app.model.nodes).filter(filter).countBy(filter).map(function(v, k) {
				return '<tr><td>'+k+'</td><td>'+v+'</td></tr>';
			}).value();
		},
		onData:function(d) {
			this.$('#DebugActivityCount').html(this.getActivityCount());
			this.$('#DebugActivityKey').html(this.getAnswerKeys());
		},
		getAnswerKeys:function() {
			return _.chain(Blaze.app.model.nodes).filter(filter).reduce(function( html, node) {
				return  html + this.getAnswerKey(node.get('sActivityType'), node);
			}, '', this).value();
		},
		addAnswerKey:function(id, func) {
			this._keys[id] = func;
		},
		highlight:function(node) {
			this.$('.debug-answer-current').removeClass('debug-answer-current');
			this.$('#DebugActivity_'+node.getFormatedNodeId('_')).addClass('debug-answer-current');
		},
		getAnswerKey:function(id, node) {
			var key = this._keys[id];
			if(!key) {
				return '<div class="debug-activiy-key-row"><div><span class="js-seg-jump">'+node.get('nodeid')+'</span><span style="float:right;">'+id + '</span></div><div>no answer key available</div></div>';
			}
			return '<div id="DebugActivity_'+node.getFormatedNodeId('_')+'" class="debug-activiy-key-row">' + key.call(this, node) + '</div>';
		},
		makeRowHeader:function(node, q_arg) {
			return '<div><span class="js-seg-jump">'+node.get('nodeid')+'</span><span style="float:right;">'+node.get('sActivityType') + '</span></div><div>Q: '+node.get(q_arg || 'sPrompt')+'</div>';
		},
		addDefualtKeys:function() {
			this._keys = {};

			this.addAnswerKey('MultChoice', function(node) {
				var choices = node.groupForDisplay(['sChoice[n]', 'sChoice[n]Text'], false, 'choice_', 'sChoice'),
					correct = _.findWhere(choices, {sChoice:node.get('sCorrectChoice')}),
					html = this.makeRowHeader(node);
				if(correct) {
					html += '<div>A: '+correct.sChoiceText+'</div>';
				}else{
					html += '<div>A: unable to determine answer check args</div>';
				}
				return html;
			});

			this.addAnswerKey('MultSelect', function(node) {
				var a = [],
					choices = node.groupForDisplay(['sChoice[n]', 'sChoice[n]Text'], false, 'choice_', 'sChoice'),
					html = this.makeRowHeader(node),
					correct = (node.get('sCorrectChoices')) ? node.get('sCorrectChoices').split(Blaze.regx.splitCommaTrim) : [];

				_.each(choices, function(ch) {
					if(_.contains(correct, ch.sChoice)) {
						a.push(ch.sChoiceText);
					}

				});

				if(a.length) {
					html += '<div>A: '+a.join(' | ')+'</div>';
				}else{
					html += '<div>A: unable to determine answer check args</div>';
				}
				return html;
			});

			this.addAnswerKey('OptionGroup',  function(node) {
				var a = [],
					choices = node.groupForDisplay(['sChoice[n]', 'sChoice[n]Text'], false, 'choice_', 'sChoice'),
					html = this.makeRowHeader(node),
					correct = (node.get('sCorrectChoices')) ? node.get('sCorrectChoices').split(Blaze.regx.splitCommaTrim) : [];

				_.each(choices, function(ch) {
					if(_.contains(correct, ch.sChoice)) {
						a.push(ch.sChoiceText);
					}

				});

				if(a.length) {
					html += '<div>A: '+a.join(' | ')+'</div>';
				}else{
					html += '<div>A: unable to determine answer check args</div>';
				}
				return html;
			});

			this.addAnswerKey('FillInBlanks', function(node) {
				var draggers = node.groupForDisplay(['sDragger[n]', 'sDragger[n]Name'], false),
					bays = node.groupForDisplay(['sBay[n]', 'sBay[n]Text', 'sBay[n]Draggers', 'sBay[n]Capacity']),
					html = this.makeRowHeader(node);

				html = _.reduce(bays, function(html, bay) {
					var correct = _.findWhere(draggers, {
						sDragger:bay.sBayDraggers
					});
					if(correct) {
						html += bay.sBayText.replace(/_+/, '<span style="color:#017d5b;">'+correct.sDraggerName+'</span>') +'<br />';
					}
					return html;
				}, html);

				return '<div>A: '+html+'</div>';
			});

			this.addAnswerKey('Sorting', function(node) {
				var draggers = node.groupForDisplay(['sDragger[n]', 'sDragger[n]Name'], false),
					bays = node.groupForDisplay(['sBay[n]', 'sBay[n]Text', 'sBay[n]Draggers', 'sBay[n]Capacity']),
					html = this.makeRowHeader(node);

				html = _.reduce(bays, function(html, bay) {
					var bd = bay.sBayDraggers
					html += '<div><strong>'+bay.sBayText+'</strong> - ';

					if(!bay.sBayDraggers) {
						return '<div>no correct answers defined in args</div>';
					}

					html +=  _.map(bay.sBayDraggers.split(Blaze.regx.splitCommaTrim), function(id) {
						var dragger = _.findWhere(draggers, { sDragger:id });
						if(!dragger) { return ''; }
 						return dragger.sDraggerName;
					}).join(', ');
					return html+'</div>';
				}, html);

				return '<div>'+html+'</div>';
			});

			this.addAnswerKey('PieSlider', function(node) {
				return this.makeRowHeader(node) + '<div>A: '+node.get('nCorrect')+'</div>';
			});
		}

	}));

})();