/*
activity where the user moves thumb to
 */

Blaze.dna.PieSlider = Blaze.View.extend({
	className:'activity-pie-slider',
	mixins:[
		'hashBinder',
		'globalEvents',
		'statefull',
		'templated',
		'configurable',
		'toggleEnabled',
		'activity',
		'gradable',
		'attempts',
		'transitionable',
		'timed'
	],
	args:{
		percent:'nPercent',
		correct:'nCorrect'
	},
	events:{
		'mousedown .js-thumb':'startDrag',
		'touchstart .js-thumb' : 'startDrag',
		'click .js-close':'close',
		'click .js-next':'next',
		'click .js-submit':'submit',
		'click .js-try':'tryAgian'
	},
	defaultConfig:{
		sTemplate:'PieSlider',
		cBgColor:'#333333',
		bBackgroundCircle:false,
		cSliceColor:'#c66901',
		cInnerColor:'#000000',
		nDiameter:252,
		bInnerCircle:false,
		nInnerDiameter:140,
		nThumbDiameter:195,
		nCanvasWidth:252,
		nCanvasHeight:252,
		nTolerance:10, // how close to be considered correct in percent
		nDegreeOffset:270, // oreiented to the bottom
		sCanvasId:'.js-chart',
		sPercentLabelId:'.js-percent',
		sThumbId:'.js-thumb',
		sTipId:'.js- tip',
		bModal:false
	},
	initialize:function() {
		_.bindAll(this, 'drag', 'release');
	},
	render:function() {
		this.template(this.getTemplateIdOr(), this.getTemplateData(this.config.sAdaptor));
        this.state('active');
        this.mixinAfterRender();

		var self = this;
		window.setPer = function(n) {
			self.model.set('nPercent', n);
			self.update();
		};
		window.setOffset = function(n) {
			self.config.nDegreeOffset = n;
		};
	},
	states:{
		active:{
			enter:function() {
				this.reset();
				this.enable();
				this.update();
			}
		},
		// use this for a try agian feedback
		// submited - cannot select - cannot submit
		pause:{
			enter:function() {
				this.disable();
				this.renderFeedback();

				// if feedback is inline
				// go ahead and resetChoices (changes state back to ready)
				if(!this.config.bModal) {
					//this.resetChoices();
				}
			}
		},
		feedback:{ // sumited - cannot alter - cannot submit
			enter:function() {
				this.disable();
				this.renderFeedback();
				this.drawResult();
				this.markCompleted();
			}
		},
		review:{ // TODO just restored cannot select cannot submit
			enter:function() {
				this.disable();
				this.update();
				this.renderFeedback();
				this.drawResult();
			}
		}
	},
	evaluator:function(model) {
		var a = this.getArg('percent'),
			b = this.getArg('correct');

		//console.log('answered', a, 'correct', b);

		return !_.isUndefined(a) && _.isEqual(a, b);
	},
	submit:function() {
		if(!this.isState('active')) { return; } // can only submit in active state

		var correct = this.grade();
		this.setAttempted(this.getArg('percent'));

		// if we are not giving feedback just call next
		if(this.config.sFeedbackType == 'none') {
			this.next();
			return;
		}

		// allow another try or show feedback
		if(this.isCorrect() || !this.canAttempt()) {
			this.state('feedback');
		}else{
			this.state('pause');
		}
	},
	startDrag:function(e) {
		if(!this.isState('active')) { return; }
		e.preventDefault();
		this.setPointer();
		this.getThumb().addClass('pressed');
		this.bindWindow();
	},
	drag:function(e) {
		e.preventDefault();

		var p = this.getMousePosition(e),
			cp = this.getCanvasCenter(),
			rads = Math.atan2(p.y - cp.y, p.x - cp.x);
			ang = Math.round(this.radiansToDegrees(rads));

		// normalize angle
		if (ang < 0) {
			ang += 360;
		}
		ang -= 360;
		ang = Math.abs(ang);

		this.setPercent(this.calcPercentFromAngle(ang));
		this.update();
	},

	release:function() {
		this.removePointer();
		this.releaseWindow();
		this.getThumb().removeClass('pressed');
	},
	update: function(){
		var per = this.getArg('percent'),
			arc = this.getArc(per);


		//console.log('tp', tx, ty);
		this.drawChart(this.getContext(this.config.sCanvasId), arc);
		this.setThumbPosition(arc);
		this.updateLabel(this.config.sPercentLabelId, per);

		// set tab position

	},
	setThumbPosition:function(arc) {
		var trad = this.config.nThumbDiameter / 2,
			x = (trad * Math.cos(arc.end)) + (this.config.nCanvasWidth / 2),
			y = (trad * Math.sin(arc.end))+ (this.config.nCanvasHeight / 2);
		this.getThumb().css({top:y+'px', left:x+'px'});
	},
	drawChart:function(ctx, arc) {
		var y = this.config.nCanvasHeight / 2,
			x = this.config.nCanvasWidth / 2;

		this.clearChart(ctx);
		if(this.config.bBackgroundCircle === true) {
			this.drawCircle(ctx, this.config.nDiameter / 2, x, y, this.config.cBgColor);
		}

		this.drawArc(ctx, this.config.nDiameter / 2, x, y, arc.start, arc.end);

		// draw inner circle (if inner diameter is 0 do nothing)
		if(this.config.bInnerCircle === true) {
			this.drawCircle(ctx, this.config.nInnerDiameter / 2, x, y, this.config.cInnerColor);
		}
	},


	drawResult:function() {
		var n = this.getArg('correct');
		this.drawChart(this.getContext('.js-result'), this.getArc(n));
		this.updateLabel('.js-percent-actual', n);
	},
	clearChart:function(ctx) {
		ctx.clearRect(0, 0, this.config.nDiameter, this.config.nDiameter);
	},

	setPercent:function(per) {
		//console.log('PERC', per);
		this.model.set(this.args.percent, per);
	},
	calcPercentFromAngle:function(ang){
		var percAng = ang - this.config.nDegreeOffset;
		if (percAng < 0) {
			percAng += 360;
		}
		return 100 - Math.floor(100 * percAng / 360);
	},
	getThumb:function() {
		return this.$el.find(this.config.sThumbId);
	},
	hideThumb:function() {
		this.getThumb().hide();
	},
	showThumb:function() {
		this.getThumb().show();
	},
	radiansToDegrees:function(angle) {
		return angle * (180 / Math.PI);
	},
	degreesToRadians:function(angle) {
		return angle * (Math.PI / 180);
	},
	percentToAngle:function(per) {
		return Math.round(per * (360 / 100));
	},
	angleToPercent:function() {

	},
	updateLabel: function(lbl, per){
		this.$el.find(lbl).text(per + '%');
	},
	hideTooltip:function() {
		this.$el.find(this.config.sTipId).fadeOut(200);
	},
	beforeRemove:function() {
		this.removePointer();
		this.releaseWindow();
	},
	setPointer:function() {
		$("body").css('cursor', 'pointer');
	},
	removePointer:function() {
		$("body").css('cursor', 'default');
	},
	bindWindow:function() {
		$(window).on('mousemove touchmove', this.drag);
        $(window).on('mouseup touchend', this.release);
	},
	releaseWindow:function() {
		$(window).off('mousemove touchmove', this.drag);
        $(window).off('mouseup touchend', this.release);
	},
	getCanvasCenter:function() {
		var cp = this.$(this.config.sCanvasId).offset();

		return {
			y: cp.top +  (this.config.nCanvasHeight / 2),
			x: cp.left + (this.config.nCanvasWidth / 2),
		};
	},
	getMousePosition:function(e) {
		var evt =  (e.type === 'touchmove') ? e.originalEvent.changedTouches[0] : e;
		return {
			y: evt.clientY,
			x: evt.clientX
		};
	},
	reset:function() {
		this.model.set(this.args.percent, 0);
	},


	/* ------------------------------ drawing methods ------------------------------- */
	getContext:function(id) {
		return this.$el.find(id)[0].getContext('2d');
	},
	getArc:function(per) {
		var start = this.config.nDegreeOffset % 360,
			end = (start - Math.round(per * (360 / 100))) % 360;

		start -= 360;
		start = Math.abs(start);
		end -= 360;
		end = Math.abs(end);

		return{
			start:this.degreesToRadians(start),
			end:this.degreesToRadians(end)
		};
	},
	drawArc:function(ctx, radius, x, y, start, end) {

		ctx.fillStyle = this.config.cSliceColor;
		ctx.beginPath();
		ctx.arc(x, y, radius, start, end , false);

		ctx.arc(x, y ,this.config.nInnerDiameter / 2 , end, start, true);
		ctx.fill();
	},
	drawCircle:function(ctx, radius, x, y, color) {
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, radius ,0, 2 * Math.PI, false);
		ctx.fill();
	}

});