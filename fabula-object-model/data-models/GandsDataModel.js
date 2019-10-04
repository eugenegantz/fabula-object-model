"use strict";

// ------------------------------------------------------
// Номенклатура

var voidFn          = function() {};
var IFabModule      = require("./IFabModule.js");
var IEvents         = require("./InterfaceEvents");
var ObjectA         = require("./ObjectA");
var _utils          = require("./../utils/utils");

// Для совместимости
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance)
		return this._fabulaInstance.getDBInstance();

	return DBModel.prototype.getInstance();
};


/**
 * @constructor
 * */
var GandsDataModel = function() {
	IFabModule.call(this);

	this.init();
};

GandsDataModel.prototype = _utils.createProtoChain(IEvents.prototype, IFabModule.prototype, {

	"init" : function() {

		this.dbModel = null;

		this.data = [];

		this.instances.push(this);

		this.GSUnits = Object.create(null);

		this.state = 0;

		this._init_timestamp = null;

		this._indexData = {}; // after init => Object

	},


	"instances" : [],


	_knownGSUnits: {
		"ед": {
			"type": 'num',
			"val": 1
		},
		"шт": {
			"type": 'num',
			"val": 1
		},
		"шт.": {
			"type": 'num',
			"val": 1
		},
		"1000 шт.": {
			"type": 'num',
			"val": 1000
		}
	},


	/**
	 * @return {GandsDataModel}
	 * */
	"getInstance" : function(){
		if (this.instances.length){
			return this.instances[0];
		}
		return new GandsDataModel();
	},


	/**
	 * @param {Object} arg
	 * @param {Function} arg.callback
	 * */
	"load" : function(arg) {
		arg = arg || {};

		var knex;
		var useCache            = typeof arg.useCache == "undefined" ? true : Boolean(arg.useCache);
		var callback            = typeof arg.callback == "function" ? arg.callback : voidFn;
		var _this               = this;

		var _promise            = Promise.resolve();
		var db                  = getContextDB.call(this);
		var configRow           = { "GSID": "ТСFM", "GSName": "Настройки FOM", "GSKindName":"", "GSCOP":"" };
		var configRowProps      = [];

		/*#if browser,node*/
		// Номеклатура
		_promise = _promise.then(function() {
			return db.auth();

		}).then(function() {
			knex                = db.getKnexInstance();

			var queryProps      = knex.queryBuilder();
			var queryConfig     = knex.queryBuilder();

			// SELECT [value] FROM Property WHERE extClass = 'config' AND property = 'fom-config-entry-gsid'
			queryConfig
				.select("value")
				.from("Property")
				.where("extClass", "config")
				.andWhere("property", "fom-config-entry-gsid");

			// SELECT pid, extID, property, value FROM Property WHERE ExtID IN ...
			queryProps
				.select("pid", "extID", "property", "value")
				.from("Property")
				.where("ExtID", "IN", queryConfig);

			queryProps = queryProps.toString();

			return db.query({
				"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-gs.load-0" }),
				"query": queryProps,
			});

		}).then(function(dbRes) {
			var queryMain;
			var queryProps;
			var queryExt;
			var query;


			// ---------------------
			// Основная таблица
			// ---------------------
			queryMain = knex.queryBuilder();

			dbRes.recs.forEach(function(row) {
				// Запрос из конфига
				// if ("запрос-номенклатура" == row.property)
					// queries[0] = "SELECT * FROM Gands WHERE " + dbRes.recs[c].value;

				configRowProps.push(row);
			});

			queryMain.select(
				  "ID",         "Sort",         "Sort4",        "GSID"
				, "GSID4",      "Tick",         "GSCOP",        "GSKindName"
				, "GSName",     "GSCodeNumber", "GSUnit",       "GSUnit2"
				, "GSCostSale", "GSCost",       "GSStock",      "CheckStock"
				, "ExtID",      "ImportName",   "FirmDefault",  "GSGraf"
				, "GSFlag",     "DateNew",      "UserNew",      "DateEdit"
				, "UserEdit"
			);
			queryMain.from("Gands");

			// На случай если необходимо переопределить запрос на уровне проекта
			if (_this.query)
				queryMain = _this.query;


			// ---------------------
			// Расширение номенклатуры
			// ---------------------
			queryExt = knex.queryBuilder();

			queryExt.select(
				  "GEIDC",      "GSExType",     "GSExID",       "GSExSort"
				, "GSExExtID",  "GSExName",     "GSExNum",      "GSExFlag"
				, "GSExAttr1",  "GSExAttr2",    "Tick"
			);
			queryExt.from("gandsExt");
			queryExt.where("GSExID", "IN", queryMain.clone().clearSelect().select('GSID'));


			// ---------------------
			// Свойства номенклатуры
			// ---------------------
			queryProps = knex.queryBuilder();
			queryProps.select("pid", "extID", "property", "value");
			queryProps.from("Property");
			queryProps.where("extID", "IN", queryMain.clone().clearSelect().select('GSID'));

			if (!db)
				return Promise.reject("GandsDataModel.load(): !db");

			query = ""
				       + queryMain.toString()
				+ "; " + queryExt.toString()
				+ "; " + queryProps.toString();

			return db.query({
				"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-gs.load-1" }),
				"query" : query,
			});

		}).then(function(res) {
			_this._afterLoad({
				"data": res[0].recs.concat(configRow),
				"ext": res[1].recs,
				"props": res[2].recs.concat(configRowProps)
			});

			_this._init_timestamp = Date.now();
		});
		/*#end*/

		/*  #if browser-s */
		if (_utils.isBrowser()) {
			var Ajax = require("./../browser/Ajax");

			_promise = _promise.then(function() {
				return new Promise(function(resolve, reject) {
					Ajax.req({
						"url": _this._fabulaInstance.url,
						"method": "POST",
						"data": {
							model: "GandsDataModel",
							"argument": {
								"useCache": useCache
							}
						},
						"callback": function(err, http) {
							if (err)
								return reject(err);

							_this._afterLoad(JSON.parse(http.responseText), function() {
								resolve();
							});
						}
					});
				});
			});
		}
		/*#end*/

		return _promise.then(function() {
			callback(null, _this);

		}).catch(function(err) {
			callback(err);
		})
	},


	/**
	 * @ignore
	 * */
	"_afterLoad": function(dbres, callback) {
		callback = callback || voidFn;

		var c;
		var L;
		var v;
		var gsid;
		var gslv;
		var lvs                     = [2, 4, 6];
		var _this                   = this;
		var gandsRef                = Object.create(null);
		var dataRefByGSIDGroup      = Object.create(null);

		_this.data = dbres.data;
		_this.state = 1;

		for(c=0; c<_this.data.length; c++){
			gandsRef[_this.data[c].GSID] = _this.data[c];
			if (!_this.data[c].gandsExtRef) _this.data[c].gandsExtRef = [];
			if (!_this.data[c].gandsPropertiesRef) _this.data[c].gandsPropertiesRef = [];
		}

		var gandsExt = dbres.ext;

		for(c=0; c<gandsExt.length; c++){
			if (  typeof gandsRef[gandsExt[c].GSExID] == "undefined"  ) continue;
			gandsRef[gandsExt[c].GSExID].gandsExtRef.push(gandsExt[c]);
		}

		var gandsProps = dbres.props;

		for(c=0; c<gandsProps.length; c++){
			if (  typeof gandsRef[gandsProps[c].extID] == "undefined"  ) continue;
			gandsRef[gandsProps[c].extID].gandsPropertiesRef.push(gandsProps[c]);
		}

		for (c = 0, L = _this.data.length; c < L; c++) {
			if (typeof _this.GSUnits[_this.data[c].GSID] == "undefined")
				_this.GSUnits[_this.data[c].GSID] = _this.data[c].GSUnit;

			gsid = _this.data[c].GSID;

			for (v = 0; v < lvs.length; v++) {
				gslv = gsid.substr(0, lvs[v]);

				if (gslv.length == lvs[v]) {
					if (!dataRefByGSIDGroup[gslv]) dataRefByGSIDGroup[gslv] = [];

					dataRefByGSIDGroup[gslv].push(_this.data[c]);
				}
			}
		}

		_this.dataReferences = new ObjectA(gandsRef);
		_this.dataRefByGSID = _this.dataReferences;
		_this.dataRefByGSIDGroup = new ObjectA(dataRefByGSIDGroup);

		// -------------------------------------------------------------------------------------

		var proto = Object.getPrototypeOf(_this);
		proto._matcherPatterns = [];

		var configRow = _this.dataReferences.get("ТСFM");

		if (configRow){
			// Заполнение недостающих полей в configRow
			if (_this.data.length){
				var tmp = _this.data[0];
				for(var prop in tmp){
					if (!Object.prototype.hasOwnProperty.call(tmp, prop)) continue;
					if (  configRow[prop] === void 0  ) configRow[prop] = "";
				}
			}

			for(c=0; c<configRow.gandsPropertiesRef.length; c++){
				if (configRow.gandsPropertiesRef[c].property == "номенклатура-группы"){
					proto._matcherPatterns = proto._matcherPatterns.concat(eval("("+ configRow.gandsPropertiesRef[c].value +")"));
				}
			}
		}

		// -------------------------------------------------------------------------------------

		_this._buildIndexData();

		callback(null, _this);
	},


	"_buildIndexData": function(){

		var match;

		this._indexData = {};

		for (var c = 0; c < this.data.length; c++) {

			match = this._groupMatcher(this.data[c]);

			for(var v=0; v<match.length; v++){
				if (  typeof this._indexData[match[v]] != "object"  ){
					this._indexData[match[v]] = [];
				}
				this._indexData[match[v]].push(this.data[c]);
			}

		}

	},


	/**
	 * @ignore
	 * */
	"_matcherPatterns": [],


	/**
	 * @ignore
	 * */
	"_groupMatcher": function(row){

		var tmp = [];

		for(var c=0; c<this._matcherPatterns.length; c++){
			if (
				this._matcherPatterns[c].GS
				&& row.GSID.match(this._matcherPatterns[c].GS)
			){
				tmp.push(this._matcherPatterns[c].gr);

			} else if (
				this._matcherPatterns[c].COP
				&& row.GSCOP.match(this._matcherPatterns[c].COP)
			){
				tmp.push(this._matcherPatterns[c].gr);
			}
		}

		return tmp;
	},


	/**
	 * @ignore
	 * */
	"_indexHas": function(){

	},


	/**
	 * @ignore
	 * */
	"_indexBuild": function(){

	},


	"_isDraft": function(row){
		return Boolean(row.GSName.match(/^[*]/gi) || row.GSKindName.match(/^[*]/gi));
	},


	/**
	 * Получить родительскую запись
	 * @param {Object | String} row
	 * return {Object}
	 * */
	"getParent": function(row){
		if (
			_utils.getType(row) == "object"
			&& row.GSID
		){
			return this.dataReferences.get(row.GSID.slice(0, -2))

		} else if (  typeof row == "string"  ) {
			row = this.dataReferences.get(row);
			if (row && row.GSID.length >= 4){
				return this.dataReferences.get(row.GSID.slice(0, -2))
			}

		}
		return void 0;
	},


	/**
	 * Получить данные из таблицы расширения номенклатуры GandsExt
	 * @param {Object | String} row
	 * @param {Object=} fld
	 * @param {Object=} opt
	 * */
	"getExt": function(row, fld, opt) {
		if (_utils.getType(row) == "object" && row.GSID)
			row = this.dataReferences.get(row.GSID);

		else if (_utils.getType(row) == "string")
			row = this.dataReferences.get(row);

		else
			throw new Error("1st argument suppose to be String or Object");

		if (!row)
			return [];

		if (fld && typeof fld != "object")
			throw new Error("2nd argument supposed to be type Object");

		opt = opt || {};

		// Если правила наследования не указаны явно, по умолчанию - наследовать из родителя
		opt.inherits = 'inherits' in opt ? opt.inherits : true;

		var res = !fld ? row.gandsExtRef : this._fetchRowExtFields(row, fld);

		if (!opt.inherits)
			return res;

		res = res.concat(
			this.getExt(
				this.getParent(row) || '',
				fld,
				Object.assign({}, opt, { onlyPriority: false })
			) || []
		);

		if (opt.onlyPriority) {
			var ex = {};

			res = res.sort(function(a, b) {
				return a.GSExID.length > b.GSExID.length ? -1 : 1;
			}).filter(function(extRow) {
				var key = extRow.GSExType + extRow.GSExName;

				// Если такой ключ уже был и этот ключ лежит в таблице с меньшим весом - исключить его из выборки
				// (чтобы избежать выбрасывания родственников из одной таблицы)
				if (ex[key] && extRow.GSExID.length < ex[key])
					return false;

				return ex[key] = extRow.GSExID.length;
			});
		}

		return res;
	},


	"_fetchRowExtFields": function(row, fld) {
		fld = ObjectA.create(fld);

		return row.gandsExtRef.filter(function(extRow) {
			extRow = ObjectA.create(extRow);

			return fld.getKeys().every(function(key) {
				return extRow.get(key) == fld.get(key);
			});
		});
	},


	/**
	 * Получить свойства записи. Собственные и наследуемые
	 * @param {Object | String} row - код либо запись номенклатуры
	 * @param {Array | String=} props - массив свойств
	 * @param {Object=} options - параметры выборки
	 * @return {undefined | Array}
	 * */
	"getProperty": function(row, props, options){
		var ret = [];

		if (  _utils.getType(row) == "object" && row.GSID  ){
			row = this.dataReferences.get( row.GSID);

		} else if (  _utils.getType(row) == "string"  ) {
			row = this.dataReferences.get(row);

		} else {
			throw new Error("1st argument suppose to be String or Object");
			// return void 0;
		}

		if (!row) return ret;

		if (_utils.getType(props) == "array"){

		} else if (typeof props == "string") {
			props = [props];
		} else {
			props = [];
		}

		var props_ = [], row_ = row, c;

		for(c=0; c<props.length; c++){
			if (typeof props[c] != "string") continue;
			props_[c] = props[c].toLowerCase();
		}

		do {
			if (!props_.length){
				ret = ret.concat(row_.gandsPropertiesRef);

			} else {
				for (c = 0; c < row_.gandsPropertiesRef.length; c++) {
					if (props_.indexOf(row_.gandsPropertiesRef[c].property.toLowerCase()) > -1) {
						ret.push(row_.gandsPropertiesRef[c]);
					}
				}

			}
		} while(  row_ = this.getParent(row_)  );

		if (_utils.getType(options) != "object"){
			options = {};
		}

		if (options.onlyPriority){
			var priorProps = {};
			for(c=0; c<ret.length; c++){
				if (
					typeof priorProps[ret[c].property] != "object"
					|| priorProps[ret[c].property].extID.length < ret[c].extID.length
				){
					priorProps[ret[c].property] = ret[c];
				}
			}
			ret = [];
			for(var prop in priorProps){
				if (!priorProps.hasOwnProperty(prop)) continue;
				ret.push(priorProps[prop]);
			}
		}

		return ret;
	},


	/**
	 * @param {Object} arg
	 * @param {Array} arg.cop - Массив из RegExp для поиска среди КОПов
	 * @param {Array} arg.type
	 * */
	"get" : function(arg){
		if (typeof arg != "object") arg = Object.create(null);
		var type = _utils.getType(arg.type) == "array" ? arg.type : [];
		if (_utils.getType(arg.group) == "array") type = arg.group;
		var cop = _utils.getType(arg.cop) == "array" ? arg.cop : [];
		var flags = _utils.getType(arg.flags) == "array" ? arg.flags : [];
		var useDraft = typeof arg.useDraft == "undefined" ? true : Boolean(arg.useDraft);

		if (!type.length && !cop.length) return this.data;

		var tmp = [], c, v, match;

		if (
			type.length == 1
			&& !cop.length
			&& !flags.length
			&& useDraft
		){
			if (  typeof this._indexData[type[0]] != "object"  ){
				return [];
			}
			return this._indexData[type[0]];
		}

		var flagsRegEx = new RegExp(flags.join("|"));

		for (c = 0; c < this.data.length; c++) {

			if (  tmp.indexOf(this.data[c]) > -1  ) continue;

			if (  this._isDraft(this.data[c]) && !useDraft  ){
				continue;
			}

			if (  flags.length && !this.data[c].GSFlag.match(flagsRegEx)  ){
				continue;
			}

			match = this._groupMatcher(this.data[c]);

			for(v=0; v<match.length; v++){
				if (  type.indexOf(match[v]) > -1  ){
					tmp.push(this.data[c]);
					break;
				}
			}

			for(v=0; v<cop.length; v++){
				if (  cop[v] instanceof RegExp  ){
					if (  this.data[c].GSCOP.match(cop[v])  ){
						tmp.push(this.data[c]);
					}

				} else if (  typeof cop[v].GSCOP == "string"  ) {
					if (  cop[v] == this.data[c]  ){
						tmp.push(this.data[c]);
					}
				}
			}
		}

		return tmp;
	},


	"getGSUnit": function(GSID){
		if (typeof GSID == "undefined") return;

		if (typeof this.GSUnits[GSID] == "undefined") return;

		return this.GSUnits[GSID];
	},


	"GSUnitConvert": function(from, to, value) {
		from = this._knownGSUnits[from];
		to = this._knownGSUnits[to];

		if (!to || !from)
			throw new Error("GSUnitConvert: Unknown unit type");

		if (from.type != to.type)
			throw new Error("GSUnitConvert: must be same type");

		return (+value * from.val) / to.val;
	},


	"getJSON": function(){
		var ret = Object.create(null);
		ret.data = this.data;
		ret.GSUnits = this.GSUnits;
		return ret
	},


	/**
	 * Является ли данная строка ссылкой на номенклатуру
	 * @param {String} str
	 * */
	"hasGsLinks": function(str) {
		return !!this.matchGsLinks(str).length;
	},


	/**
	 * Получить подстроки из строки, в которых содержатся ссылки на номенклатуру
	 * @param {String} str
	 * @return {Array | undefined}
	 * */
	"matchGsLinks": function(str) {
		return (str.match(/\[gs\][a-zA-Z0-9а-яА-Я;\s]+\[\/gs\]/ig) || []).reduce(function(arr, gsLnk) {
			gsLnk = _utils.rmGsTags(gsLnk).split(/;\s*/ig);

			arr.push.apply(arr, gsLnk);

			return arr;
		}, []);
	},


	/**
	 * @param {String} str
	 * @param {Boolean} withNested - получить запись вместе с вложенными в нее
	 * @return {Array}
	 * */
	"parseGsLink": function(str, withNested) {
		var self = this;

		return (self.matchGsLinks(str) || []).reduce(function(prev, curr) {
			return prev.concat((
				withNested
					? self.dataRefByGSIDGroup.get(curr) || self.dataRefByGSID.get(curr)
					: self.dataRefByGSID.get(curr)
			) || [])
		}, []);
	}

});

module.exports = GandsDataModel;