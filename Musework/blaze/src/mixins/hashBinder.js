// mixin hashbinder
// bind any object that has Backbone.Events uses listenTo so use stopListening to unbind
// requires: none
// usage:
//
//
//
//
Blaze.Mixer.add('hashBinder', {
	hashbind:function(obj, events) {
        var self = this;

        if(obj && _.isFunction(obj.listenTo) && _.isObject(events)) {
            _.each(events, function(name, evt) {
                var func = self[name];
                if (_.isFunction(func)) {
                    self.listenTo(obj, evt, _.bind(func, self));
                }
            });
        }
        return this;
	}
});