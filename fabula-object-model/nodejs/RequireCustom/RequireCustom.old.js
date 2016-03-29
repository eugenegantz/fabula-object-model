var modFs = require("fs");
var modPath = require("path");

// ---------------------------------------------------------------
// Ссылки на зависимости

var deps = modFs.readFileSync("./dependencies.json");
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
		"cannot_find_module": new Error("Cannot find module \"" + name + "\"")
	};

	var mod, c, path;

	for(c=0; c<requireCustom.paths.length; c++){

		try {
			mod = require(modPath.join(requireCustom.paths[c], name));
		} catch (e) {}

		if (  !mod  ){
			if (  typeof deps[name] == "object"  ){

				if (  modPath.isAbsolute(deps[name].file)  ){
					try {
						mod = require(deps[name].file);

					} catch (e) {}

				} else {
					try {
						mod = require(modPath.join(requireCustom.paths[c], deps[name].file));
					} catch (e) {}

				}

			}
		}

		if (mod) break;

	} // for

	if (  !mod  ){
		throw errConst.cannot_find_module;
	}

	return mod;





	// Попытка вызвать нативный или npm модуль
	try {
		mod = require(name);
	} catch (e) {

	}

	// Вернуть нативный модуль
	if (mod) return mod;

	// ---------------------------------------------------------------------------
	// Проверка наличия custom модуля из dependencies.json
	if (typeof deps[name] != "object"){
		throw errConst.cannot_find_module;
	}

	if (  !deps[name].file  ){
		throw errConst.cannot_find_module;
	}

	if (  !deps[name].exists  ) {

		if (  !modPath.isAbsolute(deps[name].file)  ){
			for(  c=0; c<requireCustom.paths.length; c++  ){
				path = modPath.join(requireCustom.paths[c], deps[name].file);
				try {

				} catch (e) {

				}
			}

			if (  !requireCustom.paths  ) path = deps[name].file;

			if (  modFs.existsSync(deps[name].file)  ) {
				deps[name].exists = true;
			}

		}

		if (  !deps[name].exists  ){
			throw errConst.cannot_find_module;
		}

		deps[name].file = path;

	}

	// ---------------------------------------------------------------------------

	return require(deps[name].file);

};

// ---------------------------------------------------------------------------

requireCustom.paths = [__dirname];

/**
 * Установка пути для поиска модулей
 * @param {String} path
 * */
requireCustom.addPath = function(path){
	this.paths.push(path);
};

// ---------------------------------------------------------------------------

module.exports = requireCustom;