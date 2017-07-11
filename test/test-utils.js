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
	},


	/**
	 * @param {Object} gsRow
	 * @return {Object}
	 * */
	"mkGsRow": function(gsRow) {
		return Object.assign({
			"ID": "",
			"Sort": 0,
			"Sort4": 0,
			"GSID": "",
			"GSID4": "",
			"Tick": 0,
			"GSCOP": "",
			"GSKindName": "",
			"GSName": "",
			"GSCodeNumber": "",
			"GSUnit": "",
			"GSCostSale": 0,
			"GSCost": 0,
			"GSStock": 0,
			"CheckStock": 0,
			"ExtID": "",
			"ImportName": "",
			"FirmDefault": "",
			"GSGraf": 0,
			"DateNew": "",
			"UserNew": "",
			"DateEdit": "",
			"UserEdit": "",
			"gandsExtRef": [],
			"gandsPropertiesRef": []
		}, gsRow)
	},


	/**
	 * @param extRow
	 * @return {Object}
	 * */
	"mkGsExtRow": function(extRow) {
		return Object.assign({
			"GEIDC": 0,
			"GSExType": "",
			"GSExID": "",
			"GSExSort": "",
			"GSExExtID": "",
			"GSExName": "",
			"GSExNum": 0,
			"GSExFlag": "",
			"GSExAttr1": "",
			"GSExAttr2": "",
			"Tick": ""
		}, extRow);
	},


	/**
	 * @param {Object} prop
	 * @return {Object}
	 * */
	"mkGsPropRow": function(prop) {
		return Object.assign({
			"pid": "",
			"extID": "",
			"property": "",
			"value": ""
		}, prop);
	}

};