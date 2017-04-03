var autoMatch = function() { return true; };


// a simple attempt at a
Blaze.Parser = function(matcher, parse) {
	if(!_.isFunction(parse)) {
		console.warn("parser initialized without parser function, a pass through function will be applied");
		parse = function(a) { return _.toArray(arguments); };
	}

	// string matcher
	if (_.isString(matcher)) {
		this.match = (matcher === '') ? autoMatch : function(attr) { return attr == matcher; };
	} else if (_.isRegExp(matcher)) {
		this.match = function(attr) { return matcher.test(attr); };
	}else if(_.isFunction(matcher)) {
		this.match = matcher;
	}else if(_.isObject(matcher)) {
		// alow for where clauses
		this.match = function(attr)  {
			if(_.isArray(attr)) {
				return (_.findWhere(attr, matcher));
			}
			if(_.isObject(attr)){
				// make sure attr is wraped
				return (_.findWhere([attr], matcher));
			}
			return false;
		};
	}else{
		this.match = autoMatch;
	}

	this.parse = parse;
};

var _parsers = {};
Blaze.Parsers = {
	add:function(id, matcher, parse) {
		_parsers[id] = new Blaze.Parser(matcher, parse);
	},
	// parse without matching
	parse:function(id, attr) {
		var parser;
		if(_.isArray(id)) {
			id = _.find(id, function(pid) {
				var p = _parsers[pid];
				if(!p) { return false; }
				return p.match(attr);
			});
			parser = _parsers[id];
		}else{
			parser = _parsers[id];

			// failed match do not parse
			if(parser && !parser.match(attr)) {
				console.error("failed parsing ", id);
				return;
			}
		}

		if(parser) {
			return parser.parse.apply(this, _.toArray(arguments).slice(2));
		}else{
			console.error('could not find parser '+id);
		}
	}
};
