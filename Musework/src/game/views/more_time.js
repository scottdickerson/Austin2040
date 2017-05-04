Blaze.dna.MoreTime = Blaze.View.extend({
    className:'moretime overlay',
    configid:'MoreTime',
    mixins:['hashBinder', 'globalEvents' ,'templated', 'configurable'],
    events:{
        'click .js-yes':'yes'
    },
    initialize:function() {
        this.render();
        this.$el.hide();
    },
    render:function() {

    },
    open:function(state) {

        this.template('moretime', {title: "Do you need more time"
        });
        // Start the screensaver timer ticking here
        this.trigger('game:canstart');
        this.show();
        this.touchListener = document.addEventListener("touchstart", _.bind(this.yes, this), false);
        this.mouseListener = document.addEventListener("mousedown", _.bind(this.yes, this), false);
    },
    yes:function() {
        this.hide();
        // Clear the screensaver timer ticking here
        this.trigger('game:cannotstart');
        // restart the warning timer
        this.clearTimer();
        this.startTimer();
        document.removeEventListener("touchstart", this.yes, false);
        document.removeEventListener("mousedown", this.yes, false);
    },
    show:function() {
        this.$el.show();
    },
    hide:function() {
        this.$el.hide();
    },
    startTimer:function() {
        this.countdown = setTimeout(_.bind(this.open, this), this.config.timer);
    },
    clearTimer:function() {
        clearTimeout(this.countdown);
    }
});