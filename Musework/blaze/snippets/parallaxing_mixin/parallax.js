(function() {

// parallaxing - currently only handles horizontal
// requires animator
Blaze.Mixer.add('parallaxing', {
		mixinAfterInitialize:function() {
			this._paused = false;
			this._active = false;
			this._speed = 0;
			this._scale = 1000;
			this._dir = "right";
			// flag to prevent deviceOrientation from setting _speed to 0 on tablets while buttons in use
            this._buttonsActive = false;
		},
		// this sets parallax scale (0-1000) is the default
		setParallaxScale:function(n) {
			this._scale = n;
		},
		// set the max speed (currently only has one speed but it would be cool to have acceleration)
		setParallaxMaxSpeed:function(n) {
			this._maxspeed = n;
		},
		setSpeed:function(n) {
			this._speed = n;
		},
		// set a jquery element or a jquery selector
		// you must call this before your parallaxing work
		setParallaxContainer:function(c) {
			var container = _.isString(c) ? this.$(c) : c;
			this.container = container;
			this.vw = $(container).width();
			this.vh = $(container).height();
			this.layers = _.map(container.find('.parallax-layer'), this.getLayerInfo, this);
			this.container.addClass('parallaxing-right');
		},
		// get all the layers and store some info on them
		startParallax:function() {
			this._active = true;
			this.listenForArrows();
			// if the animator mixin is not started go ahead and start it
			if(!this.isAninmating()) {
				this.startAnimation();
			}
			this.updateParallax(0);
		},
		events:{
			'mousedown .js-parallax-left':'parallaxLeft',
			'mouseup .js-parallax-left':'stopParallax',
			'mousedown .js-parallax-right':'parallaxRight',
			'mouseup .js-parallax-right':'stopParallax'
		},
		getLayerInfo:function(el) {
			var $layer = $(el),
				w = $layer.data('lax-width') ||  $layer.width();

			$layer.width(w);

			return {
				id: $layer.attr('id'),
				w: w - this.vw,
				$layer: $layer
			};
		},
		listenForArrows:function() {
			var self = this;

			if(_.isTouch()) {
				window.addEventListener('deviceorientation', function(e) {
                    if (!self._buttonsActive) {
                        // ipads and Galaxy tab report beta and gamma on different axes:
                        // when in landscape, ipads indicate +-90 as window.orientation
                        // while galaxy tab reports 0 for the same.
                        var beta;
                        switch (window.orientation) {
                            case -90:
                                beta = e.beta;
                                break;
                            case 0:
                                beta = -e.gamma;
                                break;
                            case 90:
                                beta = -e.beta;
                                break;
                        }
                        // following division "biases" the beta values so that user isn't running
                        // so quickly into the _.contrain limits.  Tablet feels less erratic.
                        beta /= 2.5;
						self._speed = Math.round((beta > 2 || beta < -2) ?  _.constrain(beta,-20, 20) : 0);
                    }
				});
			}else{
				$(document).keydown(function(e) {
					var key = e.which;
					if(!self._active || key != 37 && key != 39) { return; }
					if(key == 37) {
						self.parallaxLeft();
					}else{
						self.parallaxRight();
					}
					e.preventDefault();
				}).keyup(function(e) {
					self.stopParallax();
					e.preventDefault();
				});
			}
		},
		parallaxLeft:function(e) {
			this.container.removeClass('parallaxing-right').addClass('parallaxing-left');
            this._buttonsActive = true;
			this._speed = -7;
		},
		parallaxRight:function(e) {
			this.container.removeClass('parallaxing-left').addClass('parallaxing-right');
            this._buttonsActive = true;
			this._speed = 7;
		},
		stopParallax:function(e) {

            this._buttonsActive = false;
			this._speed = 0;
		},
		stopListeningForArrows:function() {
			if(_.isTouch()) {
				window.removeEventListener('deviceorientation');
			}else{
				$(document).unbind('keydown').unbind('keyup');
			}
		},
		onAnimationFrame:function(time) {
			if(this._speed === 0 || !this._active) { return; }

			var p = _.constrain(this._pos + this._speed, 0, this._scale);

			if(p != this._pos) {
				this.updateParallax(p);
			}
		},
		updateParallax:function(p) {
			this._pos = p;
			_.each(this.layers, this.moveLayer, this);

			this.container.toggleClass('parallax-end-left', (p === 0)).toggleClass('parallax-end-right', (p === 1000));
			this.onUpdateParalax(p);
		},
		// use this function to tie functionality to the parallaxing
		onUpdateParalax:function(pos) {},
		moveLayer:function(layer) {
			var m = _.toScale(this._pos, this._scale, layer.w) * -1;
			layer.$layer.css({left:m +"px"});
		},
		mixinBeforeRemove:function() {
			this.stopListeningForArrows();
		},
		pauseParallax:function() {
			this._active = false;
		},
		resumeParallax:function() {
			this._active = false;
		}
	});
})();