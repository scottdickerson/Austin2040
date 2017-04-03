// Requires jquery-ui (not included in blaze.dependencies)

Blaze.dna.Slider = Blaze.View.extend({
	className:'activity-slider',
	mixins:[
		'hashBinder',
		'globalEvents',
		'templated',
		'configurable',
		'commandable',
		'statefull',
		'gradable',
		'toggleEnabled',
		'attempts',
		'transitionable'
	],
	events:{
		'slidechange .js-slider':'slideChange',
		'click .js-submit':'submit',
	},
	args:{
		max:'nMax',
		min:'nMin',
		correct:'sCorrect',
		start:'nStart',
		step:'nStep'
	},
	defaultConfig:{
		sTemplate:'Slider',
		sAdaptor:'Slider',
		bMulti:false,
		bRepeatable:true,
		bAutoSubmit:false,
		sOrientation:"horizontal",
		bRange:false,
		nStep:1,
		nLabelStep:1
	},
	states:{
		active:{
			enter:function() {

			}
		},
		pause:{
			enter:function() {

			}
		},
		feedback:{
			enter:function() {

			}
		},
		review:{
			enter:function() {

			}
		}
	},
	render:function() {
		this.template(this.getTemplateIdOr(), this.getTemplateData(this.config.sAdaptor));
		this.state('ready');


		this.mixinAfterRender();

		this.initSlider();
	},
	initSlider:function() {
		this.slider = $('.js-slider').slider({
			min:this.getArg('min'),
			max:this.getArg('max'),
			orientation:this.config.sOrientation,
			range:this.config.bRange,
			step:this.getArg('step') || this.config.nStep,
			start:this.getArg('start')
		});
	},
	slideChange:function(e, ui) {
		console.log('slider change', e, ui);
		if(this.config.bAutoSubmit) {
			this.submit();
		}
		this.setAnswered($( ".js-slider" ).slider( "value"));
	},
	evaluator:function() {
		var ranges, correct = this.getArg(this.args.correct),
			a = this.getAnswered();
		if(!correct && !a) {
			return false;
		}

		// if we are looking for a specific number
		if(_.isNumber(correct)) {
			return _.isEqual(a, correct);

		// we are looking for a range e.g: 1, 4
		}else if(_.isString(correct)) {
			ranges = correct.split(Blaze.regx.splitCommaTrim);


			return a >= parseInt(ranges[0]) && a <= parseInt(ranges[1]);
		}

	},
	submit:function() {
		this.grade();
		this.setAttempted(this.getAnswered());

		console.log('EVAL', this.evaluator());
	}
});