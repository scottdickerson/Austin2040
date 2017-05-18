Blaze.dna.StartScreen = Blaze.View.extend({
	className:'start-screen overlay',
	configid:'StartScreen',
	mixins:['templated', 'configurable'],
	events:{
		'click .play-button':'start',
		'click .play-button2':'startWithTimer',
	},
	initialize:function() {
		_.bindAll(this, 'next', 'showPlay');
		this.totalHelp = 4;
		this.template('start_screen');
		this.hide();
		this.continue=true;
	},
	instruct:function() {
		_.delay(this.next, this.config.instructionTime);
	},
	next:function() {
		console.log('next called', this.count);
		if(this.continue) {
			if(this.count < this.totalHelp) {
				this.$('.how-'+this.count).hide();
			}
			this.count++;
			if(this.count > this.totalHelp) {
				_.delay(this.showPlay, 300);
			}else{
				this.$('.how-'+this.count).show();
				this.instruct();
			}
        }
	},
    skipIntro:function() {
        //Stop the help messages
        this.$('.how-'+this.count).hide();
        this.continue = false;
        this.showPlay();
    },
	start:function() {
		this.trigger('game:startWithoutTimer');
	},
    startWithTimer:function() {
        this.trigger('game:startWithTimer');
    },
	hide:function() {
		this.$el.hide();
	},
	show:function() {
		this.$el.show();
		this.count = 0;
		// after title animates in
		_.delay(this.next, 500);
	},
	showPlay:function() {
		this.$('.play-button').show();
		this.$('.play-button2').show();
		// Hide the last one shown
        this.$('.how-'+this.totalHelp).hide();
		this.$('.how-'+this.count).hide();
        this.$('.beginner').show();
        this.$('.advanced').show();
		this.trigger('game:canstart');
	}
});