// Blaze Global Template Manager
// loads and parses templates from Dom or external html file
// uses mustache templating
// adds stored helper functions and  partial templates onto every render call data object
// you should always call a toJSON() on models instead of passing the the model._attributes object
Blaze.Templates = {
	notifyMissing:true,
	// buckets
	_templates:{},
	_partials:{},
	_helpers:{},
	// default jquery selectors to get templates
	selectors:{
		template:'script[type*=mustache]',
		partial:'script[type*=partial]'
	},
	// returns a promise
	load:function(url, tselector, pselector) {
		return Blaze.loadAsset(url+".html", 'html', function(html) {
			// wrap in a div so find will work with top level script tags
			Blaze.Templates._parseHTML($('<div>'+html+'</div>'), tselector, pselector);
		});
	},
	// loads whole html as a single template
	// returns a promise
	loadSingleTemplate:function(id, url) {
		return Blaze.loadAsset(url+'.html', 'html', function(html) {
			Blaze.Templates.addTemplate(id, html);
		});
	},
	// this will get templates from current html page (non async action)
	getFromDom:function(tselector, pselector) {
		this._parseHTML($('body'), tselector, pselector);
	},
	addTemplate:function(id, template) {
		this._templates[id] = template;
	},
	addPartial:function(id, partial) {
		this._partials[id] = partial;
	},
	addHelper:function(id, func) {
		if(_.isFunction(func)) {
			this._helpers[id] = function() { return func; };
		}
	},
	getPartial:function(id) {
		return this._partials[id];
	},
	getTemplate:function(id) {
		return this._templates[id];
	},
	getHelper:function(id) {
		return this._helpers[id];
	},
	hasPartial:function(id) {
		return _.has(this._partials, id);
	},
	hasTemplate:function(id) {
		return _.has(this._templates, id);
	},
	// takes an array and returns the first one it finds or a defualt if no match is found
	hasMatch:function(a) {
		var t = Blaze.Templates._templates;
		return _.find(a, function(tmp) {
			if(!_.isString(tmp)) {
				return false;
			}
			return !_.isUndefined(t[tmp]);
		});
	},
	hasHelper:function(id) {
		return _.has(this._helpers, id);
	},
	// render a template with helpers and partials
	render:function(id, data, partials) {
		if(!this.hasTemplate(id)) {
			// only retrun a missing template message if Blaze.Templates.notifyMissing is set to true
			return (this.notifyMissing) ? 'Missing Template '+id : '';
		}
		return this.renderRaw(this.getTemplate(id), data, partials);
	},
	// allow a non stored template to be rendered
	renderRaw:function(template, data, partials) {
		return Mustache.render(template, this._addHelpers(data) , this._addPartials(partials));
	},
	_parseHTML:function(html, tselector, pselector) {
		var tsel = tselector || this.selectors.template,
			psel = pselector || this.selectors.partial;

		_.extend(this._templates, this._extractor(html, tsel));
		_.extend(this._partials, this._extractor(html, psel));
	},
	// gets templates or partials out of dom node, expects node to be wrapped jquery
	_extractor:function(node, selector) {
		return _.reduce($(selector, node), function(collector, el) {
			el = $(el);
			collector[el.attr('id')] = el.html();
			return collector;
		}, {});
	},
	// these add partials and helpers onto data at render time
	// note if a key exsits on the data object which is also a helper the data opject will be used
	_addHelpers:function(data) {
		if(!data) { return this._helpers; }
		return _.extend({}, this._helpers, data);
	},
	_addPartials:function(partials) {
		if(!partials) { return this._partials; }
		return  _.extend({}, this._partials, partials);
	},
	// hook for debug panel
	getAvailable:function() {
		return {
			templates:_.keys(this._templates),
			partials:_.keys(this._partials),
			helpers:_.keys(this._helpers)
		};
	}
};

// allows calling a partial from inside a template
// partial name can be dynamic
// use: {{#partial}}partial_name{{/partial}} or  {{#partial}}{{partialNameArg}}{{/partial}}
Blaze.Templates.addHelper("partial", function (id, render) {
    return render('{{>' + slang.trim(render(id)) + '}}');
});
// allows for nesting of templates
// template name can be dynamic
// {{#template}}template_name{{/template}} or  {{#template}}{{templateNameArg}}{{/teamplate}}
Blaze.Templates.addHelper("template", function (id, render) {
    return render(Blaze.getTemplate(render(slang.trim(id))));
});

// allows for getting a label in a template
// adding a helper for geting labels in templates
// use: {{#label}}labelid{{/label}} or {{#label}}{{label_arg}}{{/label}}
Blaze.Templates.addHelper("label", function(id, render) {
	// remove white space from label id and get label
	return Blaze.Labels.get(render(slang.trim(id)));
});