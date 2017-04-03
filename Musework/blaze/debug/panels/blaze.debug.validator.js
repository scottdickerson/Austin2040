// this panel is to provide validation of args
// takes a segment node and validates it
// load custom validations for any project

(function() {
	var template = '<div id="DebugValidatorResults"></div>';

	Blaze.Debug.addPanel('validator',  Blaze.Debug.Panel.extend({
		initialize:function() {
			this.render();
		},
		_validators:{
			required:function(node, outcome, params) {
				if(_.isUndefined(outcome.value)) {
					outcome.errors.push('is required but missing');
				}
			},
			isString:function(node, outcome, params) {
				if(!_.isString(outcome.value) || slang.isBlank(outcome.value)) {
					outcome.errors.push('should be text');
				}
			},
			isNumber:function(node, outcome, params) {
				if(_.isNaN(parseInt(outcome.value))) {
					outcome.errors.push('should be a number');
				}
			},
			isBool:function(node, outcome, params) {
				if(outcome.value != 'true' || outcome.value != 'true') {
					outcome.errors.push('must be either true or false');
				}
			},
			endsInPeriod:function(node, outcome, params) {
				if(_.last(slang.trim(outcome.value || '')) != '.') {
					outcome.errors.push('missing period');
				}
			},
			containsText:function(node, outcome, params) {
				console.log("Parmas", params)
				if(outcome.value.indexOf(params.text) == -1) {
					outcome.errors.push('must contain '+params.text);
				}
			}
		},
		_enumValidators:{
			required:function(node, outcome, params) {
				if(!outcome.value.length) {
					outcome.errors.push('There must be at least one arg with the pattern '+outcome.arg+ ' where [n] is the index number starting with 0');
				}
			},
			zeroIndex:function(node, outcome, params) {
				if(!outcome.value.length) {
					return;
				}
				var first = _.findWhere(outcome.value, {
					index:0
				});
				if(_.isUndefined(first)) {
					outcome.errors.push('missing '+outcome.arg.replace('[n]', 0)+' all others will be ignored');
				}
			},
			missingIndex:function(node, outcome, params) {
				if(!outcome.value.length) {
					return;
				}
				var indexes = _.pluck(outcome.value, 'index'),
					max = _.max(indexes, _.identity),
					test = _.range(max + 1),
					diff = _.difference(indexes, test);

				if(diff.length) {
					outcome.errors.push('skipped indexs '+diff.join(',')+' anything above the lowest skipped index will be ignored');
				}
			},
			isNumber:function(node, outcome, params) {
				_.each(outcome.value, function(arg) {
					if(_.isNaN(parseInt(arg.value))) {
						outcome.errors.push(arg.name + 'should be number');
					}
				});
			},
			popcornTime:function(node, outcome, params) {
				_.each(outcome.value, function(arg) {
					var time, start, end;
					if(slang.contains(arg.value, '-')) {
						time = _.map(arg.value.split('-'), slang.trim);
						start = parseInt(time[0]);
						end = parseInt(time[1]);
						if(_.isNaN(start)) {
							outcome.errors.push('Start Time is malformed. must be a number in seconds. 1.11 is 71');
						}
						if(_.isNaN(end)) {
							outcome.errors.push('End Time is malformed. must be a number in seconds. 1.11 is 71');
						}
					}else{
						outcome.errors.push('time must be formated in seconds number-number example: 10-35');
					}
				});
			},
			containsText:function(node, outcome, params) {
				_.each(outcome.value, function(arg) {
					if(arg.value.indexOf(params.text) == -1) {
						outcome.errors.push(arg.name + ' must contain '+params.text);
					}
				});
			}
		},
		_definitions:{},
		globalEvents:{
			'node:start':'analyze'
		},
		events:{
			'click .js-remove':'removeNotice'
		},
		render:function() {
			this.$el.html(template);
		},
		getNodeData:function(controller, profile, nodeid, templateid) {
			var info = {
				controller:(controller || 'Custom Segment Controller'),
				found:!_.isUndefined(Blaze.dna[controller]) ? 'found in dna' : 'no class found'
			}


			var html = '<h4>Segment Details</h4><div class="debug-section"><div>Segment id: '+nodeid+'</div>';
				html += '<div>Template Controller: '+info.controller+' ('+info.found+')'+'</div>';


				if(profile) {
					html += '<div>Config Profile: '+profile+'</div>';
				}
				html += '<div>Has Custom Template: '+templateid+'</div></div>';

			return html;
		},
		analyze:function(node) {
			// match validators and gather results
			var errorcnt = 0,
				html, outcomes = [], template = node.get('sTemplate'),
				controller = node.get('sActivityType') || node.get('sTemplate'),
				profile = node.get('sProfile'),
				nodeid = node.get('nodeid'),
				templateid = Blaze.Templates.hasTemplate(node.getFormatedNodeId('_')),
				definition = this.getDefinition([controller+':'+profile, controller, nodeid]),
				$results = $('#DebugValidatorResults');

			html = this.getNodeData(controller, profile, nodeid, templateid);


			outcomes = this.validate(definition, node);

			if(outcomes.length) {
				html += this.getOutcomeHtml(outcomes);
				errorcnt = this.getOutcomeCount(outcomes);
			}else{
				html += '<div class="debug-section">No validation definition found</div>';
			}

			if(errorcnt) {
				this.triggerGlobal('debug:notify', errorcnt);
			}
			$results.html(html);

		},
		getOutcomeCount:function(outcomes) {
			return _.reduce(outcomes, function(n, outcome) {
				n += outcome.errors.length || 0;
				return n;
			}, 0);
		},
		getOutcomeHtml:function(outcomes) {
			return _.reduce(outcomes, function(html, outcome) {

				html += '<div class="debug-section debug-validator-'+outcome.valid+'">Test '+outcome.arg+' - '+_.pluck(outcome.validators, 'name').join(', ')+'</div>';
				html += '<div class="debug-small-row">';
				html += _.isArray(outcome.value) ? this.getEnumValuesDisplay(outcome.value) : outcome.value;
				html += '</div>';

				if(outcome.errors.length) {
					html += '<div class="debug-section"><ul class="debug-validator-errors">';
					_.each(outcome.errors, function(err) {
						html += '<li>'+err+'</li>';
					});
					html += '</ul></div>';
				}
				return html;
			}, '<h4>Arg Validation</h4>', this);
		},
		setDefinitions:function(data){
			_.each(data, function(def, name) {
				this.addDefinition(name, def);
			}, this);
		},
		addDefinition:function(name, def) {
			this._definitions[name] = def;
		},
		addArgValidator:function(name, func) {
			this._validators[name] = func;
		},
		addEnumValidator:function(name, func) {
			this._enumValidators[name] = func;
		},
		getDefinition:function(possible) {
			var defs = this._definitions,
				name = _.find(possible, function(s) {
					return !_.isUndefined(defs[s]);
				});
			return defs[name];
		},
		getEnumValuesDisplay:function(values) {
			return _.reduce(values, function(html, v) {
				return html+= '<div><strong>'+v.name+ '</strong>: '+v.value+'</div>';
			}, '');
		},
		getValidStatus:function(n) {
			return (n === 0) ? 'valid' : 'invalid';
		},
		getIndexMatcher:function(name) {
			var regx = _.map(name.split('[n]'), function(s) {
					return slang.isBlank(s) ? '' : '(?:'+s+')';
				}).join('(\\d+)')  + '$';
			return new RegExp(regx);
		},
		getKeyMatcher:function(name) {
			return new RegExp(name.replace('[n]', '\\d+') + '$');
		},
		getEnumValues:function(name, node) {
			var key = this.getKeyMatcher(name),
				index = this.getIndexMatcher(name),
				values = _.reduce(node.attributes, function(o, v, k) {
					if(key.test(k)) {
						o.push({
							name:k,
							value:v,
							index:parseInt(k.match(index)[1])
						});
					}
					return o;
				}, []);
			return _.sortBy(values, function(v) { return v.index; });
		},
		validate:function(definition, node) {
			var outcomes = [];

			if(definition) {
				_.each(definition.args, function(validators, arg) {
					this.processDefinition(validators, arg, node, outcomes, false);
				}, this);

				_.each(definition.enums, function(validators, arg) {
					this.processDefinition(validators, arg, node, outcomes, true);
				}, this);
			}

			// do the 'all' definition if there is one

			return outcomes;

		},
		processDefinition:function(validators, arg, node, outcomes, isEnum) {
			var outcome = {
				arg:arg,
				value:this.getValue(node, arg, isEnum),
				errors:[],
				validators:this.getValidators(validators, isEnum)
			}

			// check for required
			var required = _.findWhere(outcome.validators, {
				name:'required'
			});

			// just give optional (not required)
			if(!required && _.isEmpty(outcome.value)) {


			}else{
				_.each(outcome.validators, function(v) {
					if(_.isFunction(v.validator)) {
						v.validator(node, outcome, v.params);
					}else{
						outcome.errors.push('cannot find validator '+v.name);
					}
				});
			}

			outcome.valid = this.getValidStatus(outcome.errors.length);
			outcomes.push(outcome);
		},
		getValidators:function(validators, isEnum) {
			var lookup = isEnum ? this._enumValidators : this._validators;
			return _.map(validators, function(v) {
				var params, name = v;
				if(!_.isString(v)) {
					name = v.name;
					params = v;
				}
				return {
					name:name,
					validator:lookup[name],
					params:params
				};
			});
		},
		getValue:function(node, arg, isEnum) {
			return isEnum ? this.getEnumValues(arg, node) : node.get(arg);
		}
	}));
})();