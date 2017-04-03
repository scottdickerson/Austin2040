Blaze.Command = function(id, cmd, shortcut, scope) {
	if(!_.isFunction(cmd)) {
		throw new Error('Blaze.Command requires a command function');
	}
	this.id = id;
	this.scope = scope || Blaze.app;
	this.cmd = cmd;
	this.once = false;
	this.shortcut = shortcut;
	if(shortcut) {
		Blaze.utils.keybind('cmd_'+id, shortcut, function() {
			Blaze.Commands.run(id);
		});
	}
};
_.extend(Blaze.Command.prototype, {
	run:function() {
		Blaze.dispatcher.trigger('command:before', this.id);
		this.cmd.apply(this.scope, arguments);
		Blaze.dispatcher.trigger('command:after', this.id);
	},
	// make sure we are not holding a referce to a scope so we sill garbage collect
	// remove keyboard binding
	release:function() {
		Blaze.utils.keyunbind('cmd_'+this.id);
		// if(this.shortcut) {
		// $(document.body).unbind('keydown.cmd_'+this.id);
		// }
		this.scope = null;
	},
	lock:function() {
		this._locked = true;
	},
	unlock:function() {
		this._locked = false;
	},
	isLocked:function() {
		return (this._locked);
	}
});

Blaze.Commands = {
	_commands:{},
	_overrides:{},
	add:function(id, cmd, shortcut, scope) {
		if(this.has(id)) {
			console.warn("command cannot be added, try removing the current command "+id+" first.");
			return;
		}
		this._commands[id] = this.create(id, cmd, shortcut, scope);
		return this;
	},
	// this command will only be run once
	addOnce:function(id, cmd, shortcut, scope) {
		var cmdOnce = function() {
			cmd.apply(this, arguments);
			Blaze.Commands.remove(id);
		};
		this.add(id, cmdOnce, shortcut, scope);
		return this;
	},
	create:function(id, cmd, shortcut, scope) {
		return new Blaze.Command(id, cmd, shortcut, scope);
	},
	has:function(id) {
		return _.has(this._commands, id);
	},
	get:function(id) {
		return this._commands[id];
	},
	run:function(id) {
		var cmd = this.hasOverride(id) ? this.getOverride(id) : this.get(id);
		if(cmd && _.isFunction(cmd.run) && !cmd.isLocked()) {
			cmd.run.apply(cmd,  _.toArray(arguments).slice(1));
		}
		return this;
	},
	remove:function(id) {
		if(!this.has(id)) { return; }

		this._commands[id].release();
		delete this._commands[id];
		return this;
	},
	clear:function() {
		_.invoke(this._commands, 'release');
		this._commands = {};
		return this;
	},
	override:function(id, cmd, scope) {
		this._overrides[id] = this.create(id, cmd, scope);
		return this;
	},
	overrideOnce:function(id, cmd, scope) {
		var cmdOnce = function() {
			cmd.apply(this, arguments);
			Blaze.Commands.removeOverride(id);
		};
		this._commands[id] = this.override(id, cmdOnce, scope);
		return this;
	},
	removeOveride:function(id) {
		if(!this.hasOverride(id)) { return; }

		this._overrides[id].release();
		delete this._overrides[id];
		return this;
	},
	hasOverride:function(id) {
		return _.has(this._overrides, id);
	},
	getOverride:function(id) {
		return (this._overrides[id]);
	},
	clearOverrides:function() {
		_.invoke(this._overrides, 'release');
		this._overrides = {};
		return this;
	},
	getCommandList:function() {
		return {
			commands:this.getCommandData(this._commands),
			overrides:this.getCommandData(this._overrides)
		};
	},
	getCommandData:function(list) {
		return _.map(list, function(cmd) {
			return {
				id:cmd.id,
				shortcut:(cmd.shortcut || '')
			};
		});
	},
	lock:function(id) {
		if(this.has(id)) {
			this.get(id).lock();
		}
		if(this.hasOverride(id)) {
			this.getOverride(id).lock();
		}
	},
	unlock:function(id) {
		if(this.has(id)) {
			this.get(id).unlock();
		}
		if(this.hasOverride(id)) {
			this.getOverride(id).unlock();
		}
	}
};
// listen for command:run
Blaze.dispatcher.on('command:run', function(id) {
	Blaze.Commands.run(id, _.toArray(arguments).slice(1));
});
Blaze.dispatcher.on('command:lock', function(id) {
	Blaze.Commands.lock(id);
});
Blaze.dispatcher.on('command:unlock', function(id) {
	Blaze.Commands.unlock(id);
});