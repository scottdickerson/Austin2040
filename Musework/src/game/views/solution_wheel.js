Blaze.dna.SolutionWheel = Blaze.View.extend({
	className:'solution-wheel',
	id:'SolutionWheel',
	configid:'SolutionWheel',
	mixins:['hashBinder', 'globalEvents', 'configurable', 'modelEvents', 'toggleVisible', 'templated', 'transitionable', 'animator'],
	events:{
		'click .js-option':'choose'
	},
	initialize:function() {
		this.hide();
		this.tick = new Howl({
			urls:['audio/click1.wav']
		});
	},
	spin:function() {
		this.makeSolutions();
	},
	choose:function(e) {
		this.trigger('solution:details', $(e.currentTarget).data('solution'));
	},
	makeSolutions:function() {
		// draw solutions
		this.createSolutions();
		this.startSpin();
		this.show();
	},
	createSolutions:function() {
		var rest,
			isFirst  = this.model.get('round') == 1,
			drawn = this.collection.draw();

		if(isFirst) {
			if(!_.find(drawn, function(m) {return m.isMultiplier(); })) {
				// make sure we have a muliplier available in the frist round
				drawn[0] = this.collection.getMultiplier();
			}
		}

		rest = _.shuffle(this.collection.difference(drawn));

		console.log('Drawn', drawn);
		this.solutions = _.map(rest.concat(drawn), this.createSolution, this);
		this.lastSolutionId = _.last(rest).id;
	},
	createSolution:function(solution, i) {
		var m, el;

		m = solution.toJSON();
		m.y = ((i * 353)+30) * -1;

		el = $(Blaze.Templates.render('solution_option', m));
		m.el = el;
		this.$el.append(el);
		return m;
	},
	getHighest:function() {
		return _.min(this.solutions, function(m) { return m.y; });
	},
	getLoweset:function() {
		return _.max(this.solutions, function(m) { return m.y; });
	},
	startSpin:function() {
		this.speed = this.config.startSpeed;
		this.startAnimation();
	},
	onAnimationFrame:function(time) {
		var high, low, last;
		// calculate new position
		_.each(this.solutions, this.calcNewPos, this);

		// check to see if we are out of bounds at the top
		high = this.getHighest();
		low = this.getLoweset();

		// if so move the bottom to the top
		if(low.y > 1080) {
			low.y = high.y - 353;
			last = low.id == this.lastSolutionId;
			this.tick.play();
			this.applyDeacy();
		}
		_.each(this.solutions, this.updatePos, this);
		if(this.speed < this.config.stopThreshold && last) {
			this.finshSpin();
			return false;
		}
	},
	finshSpin:function(){
		_.each(_.last(this.solutions, 3), function(s) {
			s.el.addClass('js-option');
		});
		this.trigger('solutions:ready');
	},
	adjustWheel:function() {

	},
	calcNewPos:function(s) {
		s.y = s.y + this.speed;
	},
	updatePos:function(s) {
		s.el.css('top', s.y+'px');
	},
	applyDeacy:function() {
		this.speed = this.speed * this.config.spinDecay;
	},
	onHide:function() {
		this.stopAnimation();
		this.$el.empty();
		this.solutions = null;
	}
});





