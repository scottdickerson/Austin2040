Blaze.dna.TitleScreen = Blaze.View.extend({
	className:'title-screen',
	id:'TitleScreen',
	configid:'RoundTexts',
	mixins:['templated', 'transitionable', 'configurable'],
	transitions:{
		text1:function(el, view) {
			var def = Q.defer(),
				texts = view.$('.section-0'),
				fc = view.model.get('weather') || 'normal';

			_.each(texts, function(text, i) {
				_.delay(function() {
					$(text).removeClass('hidden');
					view.sfx.play();
				}, i * view.config.textDelay);
			});
			_.delay(function() {

				view.$('.forcast').removeClass('hidden');
				if(fc == 'normal' || fc == 'rainy') {
					view.ping.play();
				}else{
					view.screw.play();
				}
				_.delay(function() {
					def.resolve();
				}, 500);
			}, (texts.length + 1) * view.config.textDelay);

			return def.promise;
		},
		text2:function(el, view) {
			var def = Q.defer(),
				time = view.config.textDelay,
				texts = view.$('.section-1'),
				end = texts.length + 1;


			_.each(texts, function(text, i) {
				_.delay(function() {
					$(text).removeClass('hidden');
					view.sfx.play();
				}, i * time);
			});
			_.delay(function() {
				this.$('.prompt').removeClass('hidden');
				_.delay(function() {
					def.resolve();
				}, 200);
			}, end * time);


			return def.promise;
		}
	},
	initialize:function() {
		this.render();
		this.screw = new Howl({
			urls:['audio/screw.wav']
		});
		this.ping = new Howl({
			urls:['audio/rainy.wav']
		});
		this.sfx = new Howl({
			urls:['audio/text.wav']
		});
		this._active = false;
	},
	render:function() {
		this.template('round_screen');
		//var evt = _.isTouch()  ? 'touchend' : 'click';
		//this.$('.js-prompt').on(evt, _.bind(this.spinWheel, this));
	},
	events:{
		'click .js-prompt':'spinWheel'//,
		//'touchend .js-prompt':'spinWheel'
	},
	update:function() {
		var m = this.model.toJSON(),
			roundOrder = this.config['round'+m.round];

		this._active = true;
		this.order = roundOrder ? roundOrder.split(',') : [];
		return this.setRoundText(m.round, m.weather);

	},
	showSlideButton:function() {
		this.$('.instructions').show();
	},
	setRoundText:function(round, weather) {
		var el;


		el = this.$('.round-info');

		el.empty();
		this.$('.prompt').addClass('hidden');

		if(!weather) {
			weather = "normal";
		}

		var section = 0;
		_.each(this.order, function(item) {
			if(item == "forcast") {
				el.append(this.getTemplate('forcast', {
					weather:weather
				}));
				section = 1;
			}else{
				el.append(this.getTemplate('text_bubble', {
					round:round,
					text:item,
					section:section
				}));
			}
		}, this);

		this.$el.show();



		return this.transition('text1');
		/*.then(function() {
			return view.transition('text2');
		});*/


	},
	showPrompt:function() {
		return this.transition('text2');
	},
	spinWheel:function() {
		if(!this._active) {
			return;
		}
		this._active = false;
		this.trigger('game:spin');
		this.hide();
	},
	hide:function() {
		this.$el.hide();
		this.$('.round-info').empty();
		this.$('.prompt').addClass('hidden');
	}
});