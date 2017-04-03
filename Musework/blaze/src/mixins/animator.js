// mixin animator
//
// requires: none
// usage:
//
//
//
/*
May want to implement fps
var fps = 15;
function draw() {
    setTimeout(function() {
        requestAnimationFrame(draw);
    }, 1000 / fps);
}
 */
Blaze.Mixer.add('animator', {
	mixinBeforeInitialize:function() {
		this._animating = false;
		_.bindAll(this , '_animate');
	},
	startAnimation:function() {
		if(this._animating) { return; }
		this._animating = true;
		this._animate();
	},
	//stop animation if we explicitly return false from onAnimationFrame
	_animate:function(time) {
		if(this.onAnimationFrame(time) === false) {
			console.log('returned false');
			this.stopAnimation();
			return;
		}
		this.af = requestAnimationFrame(this._animate);
	},
	stopAnimation:function() {
		if(this.af) {
			cancelAnimationFrame(this.af);
		}
		this.af = null;
		this._animating = false;
	},
	mixinBeforeRemove:function() {
		this.stopAnimation();
	},
	isAninmating:function() {
		return (this._animating);
	},
	onAnimationFrame:function(time) {} // make sure this function is there
});