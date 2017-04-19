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
    },
    yes:function() {
        this.hide();
        // Clear the screensaver timer ticking here
        this.trigger('game:cannotstart');
        // restart the warning timer
        this.clearTimer();
        this.startTimer();
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