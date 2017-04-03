Blaze.dna.RoundTimer = Blaze.View.extend({
	mixins:['templated'],
	id:'RoundTimer',
	className:'round-timer animated',
	numwidth:54,
	numtime:30,

	initialize:function() {
		_.bindAll(this, 'setTime');
		this.render();
		this.hide();
		this.tick = new Howl({
			urls:['audio/clicks3.wav']
		});
		this.buzz = new Howl({
			urls:['audio/buzz2.wav'],
			volume: 0.5
		});



	},
	render:function() {
		this.template('round_timer');
	},
	setTime:function() {
		var n = this.seconds;


		var a = _.map(n.toString().split(''), function(num) { return parseInt(num); });

		if(a.length === 1) {
			a.unshift(0);
		}
		this.setDialPos(1, a[0]);
		this.setDialPos(2, a[1]);

		this.seconds--;



		if(n === 0) {
			this.timeUp();
			this.buzz.play();
			return;
		}else{
			this.tick.play();
		}

		this.timer = setTimeout(this.setTime, 1000);
	},
	setDialPos:function(dial, n) {
		this.$('#TimerDigit'+dial).css('background-position', this.calcNumPos(n)+ 'px 0');
	},
	calcNumPos:function(n) {
		if(n === 0) {

			n = 10; }
		return ((n * this.numwidth) * -1) + this.numwidth ;
	},
	startTimer:function() {
		this.seconds = this.numtime;
		this.setTime();
		this.show();
	},
	timeUp:function() {
		this.trigger('time:expired');
	},
	stopTimer:function() {
		clearTimeout(this.timer);
		this.setDialPos(1, -1);
		this.setDialPos(2, -1);
		this.hide();
	},
	show:function() {
		this.$el.show().removeClass('bounceInRight').addClass('bounceInLeft');
	},
	hide:function() {
		var el = this.$el;
		if(el.hasClass('bounceInUp')) {
			el.removeClass('bounceInRight').addClass('bounceOutLeft').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function() {
				el.hide().removeClass('bounceOutLeft');
			});
		}else{
			el.hide();
		}
	},
	intro:function() {
		this.setDialPos(1, 2);
		this.setDialPos(2, 0);
		this.show();
	}
});