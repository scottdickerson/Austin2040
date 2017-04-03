(function() {


	var containerHtml = '<div id="DebugContainer" class="debug-container">';
		containerHtml += '<div class="debug-header"><div class="debug-close">X</div><ul class="debug-menu"></ul></div>';
		containerHtml += '<div class="debug-panels"></div>';
		containerHtml += '</div>';



		var button = $('<div class="debug-launcher"><div id="DebugLauncher" class="debug-toggle-button">Debug<span id="DebugNotifyCount" class="debug-notify-count"></span></div></div>');
	var container = $(containerHtml);

	Blaze.Debug = {
		_ready:false,

		_panels:{},
		_panelCount:0,
		$button:button,
		$el:container,
		$header:container.find('.debug-header'),
		$menu:container.find('.debug-menu'),
		$panels:container.find('.debug-panels'),
		initialize:function() {
			var b = $('body');
			this._open = false;
			this._notifyCount = 0;

			$('body').append(this.$el).append(this.$button);
			this.$button.click(function(e) {
				Blaze.Debug.toggle(true);
				e.preventDefault();
			});

			this.$el.on('click', '.debug-menu-item', function(e) {
				Blaze.Debug.activate($(e.currentTarget).text());
				e.preventDefault();
			});
			this.$el.on('click', '.debug-close', function(e) {
				Blaze.Debug.toggle(false);
				Blaze.Debug.clearNotifyCount();
				e.preventDefault();
			});
			this._ready = true;

			$(window).resize(_.throttle(function() {
				Blaze.Debug.setDebugHeight();
			}, 50));


			this.activate(this.getData('currentPanel') || 'help');

			if(this.getData('opened') == true) {
				this.toggle(this.getData('opened'));
			}
			Blaze.dispatcher.trigger('debug:ready', this);
			Blaze.dispatcher.on('debug:notify', function(n) {
				Blaze.Debug.incrementNotifyCount(n);
			});
			Blaze.dispatcher.on('node:after:remove', function() {
				Blaze.Debug.clearNotifyCount();
			});
		},
		setDebugHeight:function() {
			this.$panels.find('.debug-panel').height($(window).height() - this.$menu.outerHeight() - 60);
		},
		toggle:function(b) {
			this._open = b || !this._open;
			this.$button.toggle(!this._open);
			this.$el.toggle(this._open);

			this.saveData('opened', this._open);
		},
		// you should do this after debug:ready has been called
		getPanel:function(id) {
			return this._panels[id];
		},
		addPanel:function(id, clz) {
			var p = new clz({id:id});
			this._panels[id] = p;
			this._panelCount++;
			this.addTab(id);
			this.$panels.append(p.el);
			p.deactivate();
			if(this._panelCount > 1) {

				this.getPanel('help').setPanelHelp(id, p.getPanelHelp());
			}
			this.setDebugHeight();
		},
		addTab:function(id) {
			this.$menu.append('<li id="DMI_'+id+'"class="debug-menu-item"><a href="#">'+id+'</a></li>');

		},
		activate:function(id) {
			if(this._current) {
				this._current.deactivate();
				this.$menu.find('.selected').removeClass('selected');
			}
			this._current = this._panels[id];
			if(this._current) {
				this._current.activate();
				this.$menu.find('#DMI_'+id).addClass('selected');

				this.saveData('currentPanel', id);
			}
		},
		saveData:function(attr, value, panel) {
			if(!window.store) { return; }
			store.set(this.makeSaveAttrName(attr, panel), value);
		},
		getData:function(attr, panel) {
			if(!window.store) { return; }
			return store.get(this.makeSaveAttrName(attr, panel));
		},
		makeSaveAttrName:function(attr, panel) {
			return 'debug_'+(panel || '')+'_'+attr;
		},
		incrementNotifyCount:function(n) {
			this._notifyCount = this._notifyCount + (n || 1);
			this.$button.addClass('notify');
			this.setNotifyCount();
		},
		setNotifyCount:function() {
			var cnt = this._notifyCount === 0 ? '' : '('+this._notifyCount+')';
			this.$button.find('.debug-notify-count').html(cnt);
		},
		clearNotifyCount:function() {
			this._notifyCount = 0;
			this.$button.removeClass('notify');
			this.setNotifyCount();
		}
	};

	Blaze.Debug.Panel = Blaze.View.extend({
		className:'debug-panel',
		mixins:['hashBinder', 'globalEvents', 'templated'],
		onActivate:function() {},
		onDeactivate:function() {},
		activate:function() {
			this.$el.show();
			this.onActivate();
			this._active = true;
		},
		deactivate:function() {
			this.$el.hide();
			if(this._active) {
				this.onDeactivate();
			}
			this._active = false;
		},
		getPanelHelp:function() {
			return '';
		}
	});

	// loads a debugHelp.html file for application development help
	// automaticly added if Blaze.Debug.helpPath

	//Blaze.Debug.helpPath = '../../~tools/blaze_debug_help.html';

	Blaze.Debug.addPanel('help',  Blaze.Debug.Panel.extend({
		initialize:function() {
			this.render();
			if(Blaze.Debug.helpPath){
				this.loadHelp(Blaze.Debug.helpPath);
			}
		},
		events:{
			'click .debug-help-header':'toggle'
		},
		render:function() {
			this.$el.html('<div class="debug-help-header">Debug Panels</div><div class="debug-help-body" id="debug_panel_panels"></div>');
		},
		// let panels add their own help that way we only see what
		setPanelHelp:function(panelid, html) {
			this.$('#debug_panel_panels').append('<strong>'+panelid+'</strong><p>'+html+'</p>');
		},
		loadHelp:function(path) {
			var el = this.$el;
			Blaze.loadAsset(path, 'html', function(html) {
				el.append(html);
			});
		},
		toggle:function(e) {
			$(e.currentTarget).next().toggle();
		}
	}));

	Blaze.Debug.utils = {
		html:{
			objectToTable:function(title, obj, className) {
				var html = this.h4(title)+'<table class="debug-table">';
				_.each(obj, function(v, k) {
					html += Blaze.Debug.utils.html.tr(k , v);
				});
				return html + '</table>';
			},
			h4:function(s) {
				return '<h4>'+s+'</h4>';
			},
			tr:function() {
				var a = _.toArray(arguments);
				return '<tr>'+_.map(a, function(s) {
					return Blaze.Debug.utils.html.td(s);
				}).join('') + '</tr>';
			},
			td:function(s) {
				return '<td>'+s+'</td>';
			},
			div:function(text, id, className) {

			}
		}
	};

	$(document).ready(function() {
		Blaze.Debug.initialize();
		Blaze.Debug.setDebugHeight();
	});

})();

