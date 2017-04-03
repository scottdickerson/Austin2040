(function() {
	// setup to handle multiple adaptors
	// could need tin can, scorm, and local adaptors at the same time
	var templates = {
		none:'<div id="Debug_LMS_Msg" class="debug-section">No Adaptors Available</div>',
		gui:'<div class="debug-section debug-adaptor-links"></div><div id="Debug_LMS_Panel"></div><div class="debug-section"><h4>Result</h4><div id="Debug_LMS_Msg" class="debug-row"></div></div><div class="debug-section"><h4>Last Error</h4><div id="Debug_LMS_Error" class="debug-row"></div></div>',
		menubutton:'<span class="debug-lms-menuitem" style="padding:5px;" data-adaptor="{{id}}">{{id}}</span>',
		section:'<div class="debug-section"><h4>{{label}}</h4>{{#any}}<input id="{{id1}}" type="text" />{{/any}}{{^any}}<select id="{{id1}}">{{#options}}<option value="{{.}}">{{.}}</options>{{/options}}</select>{{/any}}{{#input2}}<input id="{{id2}}" type="text" />{{/input2}}<span class="debug-right debug-button debug-lms-{{label}}">{{label}}</span></div>',
		action:'<div class="debug-section"><h4>{{headerLabel}}</h4>{{#actions}}<select id="{{id1}}">{{#options}}<option value="{{.}}">{{.}}</options>{{/options}}</select><span class="debug-right debug-button debug-lms-{{label}}">{{label}}</span></div>{{/actions}}{{^actions}}No actions available{{/actions}}</div>',
		help: "Use the lms panel to test data api apdators. You can switch current adaptor (if more that one is loaded) by clicking on the adaptor name at the top of the panel"
	};


	Blaze.Debug.addPanel('lms',  Blaze.Debug.Panel.extend({
		initialize:function() {
			this.adaptors = {};
			this.nAdaptors = 0;
			this.$el.html(templates.none);
		},
		events:{
			'click .debug-lms-menuitem':'setActive',
			'click .debug-lms-get':'doGet',
			'click .debug-lms-set':'doSet',
			'click .debug-lms-go':'doAction'
		},
		globalEvents:{
			'storage:ready':'addAdaptor',
			'storage:error':'lastError'
		},
		addAdaptor:function(id, adaptor) {
			this.adaptors[id] = adaptor;
			this.addToMenu(id);
			if(!this.current) {
				this.select(id);
			}
		},
		addToMenu:function(id) {
			if(this.nAdaptors == 0) {
				this.$el.html(templates.gui);
			}
			this.nAdaptors++;

			this.$(".debug-adaptor-links").html(this.render(templates.menubutton, {
				id:id
			}));
		},
		setAdaptor:function(e) {
			e.preventDefault();
		},
		select:function(id) {
			var a, g, s,
				adaptor = this.adaptors[id];
			if(!adaptor) { return; }

			a = adaptor.getActionList();
			g = adaptor.gettable;
			s = adaptor.settable;

			// clear previous inputs
			this.$("#Debug_LMS_Panel").empty().append(this.render(templates.section, {
				label:"get",
				any:(!_.isArray(s) || !s.length),
				id1:"Debug_LMS_Get1",
				options:g,
				input2:false
			})).append(this.render(templates.section, {
				label:"set",
				any:(!_.isArray(s) || !s.length ),
				options:s,
				input2:true,
				id1:"Debug_LMS_Set1",
				id2:"Debug_LMS_Set2"

			})).append(this.render(templates.action, {
				label:"go",
				headerLabel:'actions',
				options:a,
				actions:(a.length > 0),
				id1:"Debug_LMS_Action",
				input2:true
			}));

			this.current = adaptor;
		},
		getPanelHelp:function() {
			return templates.help;
		},
		doGet:function() {
			var v = $('#Debug_LMS_Get1').val();
			this.showResult('get',v, this.current.get(v));
		},
		doSet:function() {
			var v1 = $('#Debug_LMS_Set1').val(),
				v2 = $('#Debug_LMS_Set2').val();
			this.showResult('set', v1+':'+v2, this.current.set(v1, v2));
		},
		doAction:function() {
			var v = $('#Debug_LMS_Action').val();
			this.showResult('action', v, this.current.action(v));
		},
		showResult:function(stype, name, result) {
			$('#Debug_LMS_Msg').html(name+ " returned "+result);
		},
		lastError:function(id, msg) {
			if(this.current && this.current.id == id) {
				$('#Debug_LMS_Error').html(msg);
			}
		},




		render:function(template, model) {
			return Blaze.Templates.renderRaw(template, model);
		}
	}));

})();