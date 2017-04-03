(function() {

	var Notes = Backbone.View.extend({
		className:'release-notes-panel',
		events:{
			'click .release-notes-close':'toggle',
			'click .release-notes-notebutton':'inspect'
		},
		initialize:function() {
			this._open = false;
			Blaze.dispatcher.on('node:start', _.bind(this.render, this));

			this.$el.html('<div class="release-notes-header"><span class="release-notes-close">X</span><h4 id="Release_Notes_Header"></h4></div><div id="Release_Notes_Text" class="release-notes-text"></div>');
			this.button = $('<div class="release-notes-button">Release Notes</div>');
			this.button.click(_.bind(this.toggle, this));
			//this.button.hide();

			this.$el.hide();
			$('body').append(this.el).append(this.button);
		},
		render:function(node) {
			var id = node.id,
				note = node.get('sReleaseNote'),
				header = '';

			if(note) {
				header = node.get('sReleaseNoteTitle') || 'Release note for '+id;
				if(this._open) {

				}else{
					this.button.show();
				}
			}else{
				this.button.hide();
				this.$el.hide();
				this._open = false;
			}



			this.$('#Release_Notes_Text').html('<p>'+(note || '')+'</p>');
			this.$("#Release_Notes_Header").html(header);
		},
		makeEntry:function(node) {
			var id = node.id,
				s = node.get('sReleaseNote'),
				h = node.get('sReleaseNoteTitle') || 'Release note for '+id;

			return (!s) ? '' : '<span class="release-notes-notebutton" data-note="'+s+'" data-noteid="'+h+'">'+id+'</span>';
		},
		toggle:function() {
			this.$el.toggle();
			this.button.toggle();
			this._open = !this._open;
		}

	});

	Blaze.dispatcher.once('iledata:loaded', function(model) {
		Blaze.releaseNotes = new Notes({model:model});
	});


})();