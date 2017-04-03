(function() {

	var mapperHtml = '<div class="debug-section">';
		mapperHtml += '<h4>Mapper</h4>';

		mapperHtml += '<div>container: <input id="D_Mapper_Selector" style="font-size:1.1em;" type="text" /> jquery selector</div>';
		mapperHtml += '<div>target: <input id="D_Mapper_Target" style="font-size:1.1em;" type="text" /> jquery selector</div>';
		mapperHtml += '<div>offset x: <input id="D_Mapper_OFFX" type="text" style="width:60px; font-size:1.1em;" />&nbsp;&nbsp;';
		mapperHtml += 'offset y: <input id="D_Mapper_OFFY" type="text" style="width:60px; font-size:1.1em;"/></div>';
		mapperHtml += '<div id="D_Mapper_Results" style="background:#cdcdcd; border:1px solid #999; margin:5px 0; min-height:60px; padding:5px;"></div>';
		mapperHtml += '</div>';

	var isNumber =  function (n) {
		return !isNaN(parseFloat(n)) && isFinite(n);
	};

	Blaze.Debug.addPanel('tools',  Blaze.Debug.Panel.extend({
		globalEvents:{
			'templates:loaded':'renderData',
			'node:before:remove':'clear',
			'node:before:render':'setClass'
		},
		events:{
			'blur #D_Mapper_Selector':'updateSelector'
		},
		initialize:function() {
			this.render();
		},
		onDeactivate:function() {
			$(this.selector).off('mousedown');
			this.selector = null;
		},
		setClass:function(node) {
			this.seg = node.getFormatedNodeId('-');
		},
		updateSelector:function(e) {
			var el, self = this, val = $(e.currentTarget).val();
			if(this.selector && this.selector == val) {
				return;
			}
			if(this.selector || val === "") {
				$(this.selector).off('mousedown');
				this.selector = null;
			}
			if(val !== "") {
				el = $(val);

				if(el.length === 0) {
					this.msg('could not find '+val);
					return;
				}

				if(el.length > 1) {
					this.msg('return multiple results for '+val+' please use a unique selector');
					return;
				}

				this.selector = val;
				this.msg('');
				el.on('mousedown', function (e) {
					var s, targ, el = $(e.currentTarget),
						pos = el.offset(),
						off = self.getOff(),
						sel = $('#D_Mapper_Target').val(),
						top = Math.round(e.pageY - pos.top + off.y) + "px",
						left = Math.round(e.pageX - pos.left + off.x) + "px";

					s = '&nbsp;&nbsp;&nbsp;top: ' + top+';<br />&nbsp;&nbsp;&nbsp;left: '+left+';';

					if(sel !== '') {
						targ = $(sel);
						targ.css({ top:top, left:left });
						if(self.seg) {
							s = '.'+self.seg+' '+sel+'{<br />'+s+'<br/>}';
						}
					}
					self.msg(s);
				});
			}
		},
		clear:function() {
			this.$('#D_Mapper_Selector').val('');
			$(this.selector).off('mousedown');
			this.selector = null;
		},
		getOff:function() {
			var x = this.$('#D_Mapper_OFFX').val(),
				y = this.$('#D_Mapper_OFFY').val();

			x = isNumber(x) ? parseFloat(x, 10) : 0;
			y = isNumber(y) ? parseFloat(y, 10) : 0;

			return { x:x, y:y };
		},
		getTarget:function() {
			var s, sel = this.$('#D_Mapper_Target').val();
			if(sel === '') { return; }
			return $(sel);
		},
		msg:function(txt) {
			this.$("#D_Mapper_Results").html(txt);
		},
		render:function() {
			this.$el.html(mapperHtml);
		},
		getPanelHelp:function() {
			return '<strong>Mapper Tool</strong>' +
				'<p>Use the mapper to get css for absolutely positioned elements. Browse to segment you want to map and add the jquery selector of the element that is the element you want to position inside of. The container selector should be unique to the current page.</p>' +
				'<p>Don\'t forget the container should have position: relative;<p>' +
				'<p>the period if you are targeting a css class or the pound sign if an element id.</p>' +
				'<p>Target is a selector for the element you wish to position and should have the css position: absolute;<br /><br />The offset is used if you want the mouseclick at the center of your placement. If you had a button 30px by 30px you would set the offests to -15</p>' +
				'<p><strong>Example</strong><br /><strong>container:</strong> .hotspots<br /><strong>target:</strong> .hotspot-0<br /><strong>off x:</strong> -15<br /><strong>off y:</strong> -15<p />';


		},
		saveSettings:function() {
			
		},
		restoreSettings:function() {
			
		}
	}));
})();
