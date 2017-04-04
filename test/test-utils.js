globTestUtils = {

	"detectEnvironment": function() {
		var _env = (function() {
			return toString.call(this);
		})();

		if (_env == "[object global]")
			return "node";

		else if (_env == "[object Window]")
			return "browser";

		else
			return void 0;
	},


	"isBrowser": function() {
		return this.detectEnvironment() === "browser";
	},


	"getRoot": function() {
		var modPath = require('path');

		return modPath.join(__dirname, "./../fabula-object-model");
	},


	"getFabulaObjectModel": function(config, FabMod) {
		if (!config)
			config = globFabulaObjectModelConfig;

		FabMod = this.isBrowser()
			? window.FabulaObjectModel
			: require(this.getRoot());

		return FabMod.prototype.getInstance(config);
	}

};