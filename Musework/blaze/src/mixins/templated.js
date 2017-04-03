// mixin - templated
//
// restrictions: Blaze.View
// requires: none
// usage:
//
//
//
Blaze.Mixer.add('templated', {
	// process a stored template and return it
	getTemplate:function(templateid, json, partials) {
		return Blaze.Templates.render(templateid, json, partials);
	},
	// process a raw template and return it
	getRawTemplate:function(template, json, partials) {
		return Blaze.Templates.renderRaw(template, json, partials);
	},
	// apply template to current view element
	template:function(templateid, json, partials) {
		var t = this.getTemplate(templateid, json, partials);
		this.$el.html(t);
	},
	templateRaw:function(template, json, partials) {
		var t = this.getRawTemplate(template, json, partials);
		this.$el.html(t);
	},
	// apply template to a area of the current view
	subTemplate:function(sel, templateid, json, partials) {
		this.$(sel).html(this.getTemplate(templateid, json, partials));
	},
	// order of search
	// nodeid with underscores in place of forward slashes
	// config sTemplate
	// arg sTemplate
	// on view class templateId set
	// or a no Match
	getTemplateIdOr:function(nomatch) {
		var a = [];
		if(this.model && _.isFunction(this.model.getFormatedNodeId)) {
			a.push(this.model.getFormatedNodeId('_'));
			a.push(this.model.get('sTemplate'));
		}
		// if we have the configurable
		if(this.config) {
			a.push(this.config.sTemplate);
		}
		if(this.templateId) {
			a.push(this.templateId);
		}
		return Blaze.Templates.hasMatch(_.compact(a)) || nomatch;
	}
});
