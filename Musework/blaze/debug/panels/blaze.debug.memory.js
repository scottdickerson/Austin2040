// requires memory-stats.js
// https://github.com/paulirish/memory-stats.js

(function() {
	Blaze.Debug.addPanel('memory',  Blaze.Debug.Panel.extend({
		initialize:function() {

			if(_.isUndefined(window.MemoryStats)) {
				this.$el.html('<div class="debug-section">Requires <a href="https://github.com/paulirish/memory-stats.js">memory-stats.js</a></div>');
				return;
			}
			var stats = new MemoryStats();
		    this.$el.append(stats.domElement);


		    requestAnimationFrame(function loop(){
		        stats.update();
		        requestAnimationFrame(loop);
		    });

		}
	}));

})();