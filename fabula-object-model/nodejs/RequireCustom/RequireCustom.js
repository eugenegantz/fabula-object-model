var modFs = require("fs");
var modPath = require("path");

// ---------------------------------------------------------------
// —сылки на зависимости

var deps = modFs.readFileSync(modPath.join(__dirname, "./dependencies.json"));
deps = JSON.parse(deps);

if (typeof deps != "object") {
	deps = Object.create(null);
}

// ---------------------------------------------------------------

/**
 * @param {String} name
 * @return {Object}
 * */
var requireCustom = function(name){
	var errConst = {
		"cannot_find_module": function(){
			return new Error("Cannot find module \"" + name + "\"");
		}
	};

	var mod, c;

	for(c=0; c<requireCustom.paths.length; c++){

		try {
			mod = require(modPath.join(requireCustom.paths[c], name));
		} catch (e) {

		}

		if (  !mod  ){
			if (  typeof deps[name] == "object"  ){

				if (  modPath.isAbsolute(deps[name].file)  ){
					try {
						mod = require(deps[name].file);
					} catch (e) {

					}

				} else {
					try {
						mod = require(modPath.join(requireCustom.paths[c], deps[name].file));
					} catch (e) {

					}

				}

			}
		}

		if (mod) break;

	} // for

	if (  !mod  ){
		throw errConst.cannot_find_module();
	}

	return mod;
};

// ---------------------------------------------------------------------------

requireCustom.paths = [__dirname];

/**
 * ”становка пути дл€ поиска модулей
 * @param {String} path
 * */
requireCustom.addPath = function(path){
	this.paths.push(path);
};

// ---------------------------------------------------------------------------

module.exports = requireCustom;