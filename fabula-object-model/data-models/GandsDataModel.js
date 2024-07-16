"use strict";

// ------------------------------------------------------
// Номенклатура

var IFabModule = require("./IFabModule.js");
var IEvents = require("./InterfaceEvents");
var ObjectA = require("./ObjectA");
var _utils = require("./../utils/utils");
var dbUtils = require("./../utils/dbUtils");

// Для совместимости
var getContextDB = function(){
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (  this._fabulaInstance ){
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};


/**
 * @constructor
 * */
var GandsDataModel = function(){
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

		this.dataReferences = new ObjectA({});

		this.dataRefByGSID = this.dataReferences;

		this.dataRefByGSIDGroup = new ObjectA({});
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
		if (typeof arg == "undefined") arg = Object.create(null);
		var useCache = typeof arg.useCache == "undefined" ? true : Boolean(arg.useCache);
		var callback = typeof arg.callback == "function" ? arg.callback : function() { };
		var _this = this;

		var db = getContextDB.call(this);

		/*#if browser,node*/
		// Конфиг по-умолчанию
		var _gandsQuery = ""
			+ " SELECT * FROM Gands"
			+ " WHERE "
			+ "    GSCOP LIKE '87%'"
			+ " OR GSCOP LIKE '17%'"
			+ " OR GSCOP LIKE '27%'"
			+ " OR GSCOP LIKE '07%'"
			+ " OR GSID LIKE 'ТСПо%'"

		Promise.resolve().then(function() {
			if (!db)
				return Promise.reject("!GandsDataModel.load(): !db");

			var promises = [];

			// На случай если необходимо переопределить запрос на уровне проекта
			if (_this.sqlWhere) {
				_gandsQuery = "SELECT * FROM Gands WHERE (" + _this.sqlWhere + ")";
			}

			var gandsQuery = _gandsQuery.replace("*", ""
				+ "  __TOP__"
				+ "  __IDENTITY__, [Sort], [Sort4], [GSID]"
				+ ", [GSID4], [Tick], [GSCOP], [GSKindName]"
				+ ", [GSName], [GSCodeNumber], [GSUnit], [GSUnit2]"
				+ ", [GSCostSale], [GSCost], [GSStock], [CheckStock]"
				+ ", [ExtID], [ImportName], [FirmDefault], [GSGraf]"
				+ ", [GSFlag], [DateNew], [UserNew], [DateEdit], [UserEdit]"
			)
				+ " AND __WHERE_IDENTITY__"
				+ " __ORDER_BY__";

			var extQuery = ""
				+ " SELECT"
				+ " __TOP__"
				+ "   __IDENTITY__, [GSExType], [GSExID], [GSExSort], [GSExExtID], [GSExName]"
				+ " , [GSExNum], [GSExFlag], [GSExAttr1], [GSExAttr2], [Tick], [DateEdit]"
				+ " FROM GandsExt"
				+ " WHERE"
				+ " __WHERE_IDENTITY__"
				+ " AND GSExID IN (" + _gandsQuery.replace(/[*]/gi, "GSID") + ")"
				+ " __ORDER_BY__";

			var propsQuery = ""
				+ " SELECT"
				+ " __TOP__"
				+ " __IDENTITY__, pid, extID, property, value FROM Property"
				+ " WHERE"
				+ " __WHERE_IDENTITY__"
				+ " AND ExtID IN (" + _gandsQuery.replace(/[*]/gi, "GSID") + ")"
				+ " __ORDER_BY__";

			// Основная таблица
			promises.push(
				db.query({
					"query": gandsQuery,
					"identityField": "ID",
					"chunked": true
				})
			);

			// Расширение номенклатуры
			promises.push(
				db.query({
					"query": extQuery,
					"identityField": "GEIDC",
					"chunked": true
				})
			);

			// Свойства номенклатуры
			promises.push(
				db.query({
					"query": propsQuery,
					"identityField": "uid",
					"chunked": true
				})
			);

			return Promise.all(promises);

		}).then(function(res) {
			_this._afterLoad({
				"data": res[0].recs,
				"ext": res[1].recs,
				"props": res[2].recs
			}, callback);

			_this._init_timestamp = Date.now();

		}).catch(function(err) {
			callback(err);
		});
		/*#end*/

		/*  #if browser-s */
		if (  _utils.isBrowser()  ){
			var Ajax = require("./../browser/Ajax");
			Ajax.req({
				"url": _this._fabulaInstance.url,
				"method": "POST",
				"data": {
					model: "GandsDataModel",
					"argument": {
						"useCache": useCache
					}
				},
				"callback": function(err, http){
					if (err){
						callback(err);
						return;
					}
					_this._afterLoad(JSON.parse(http.responseText), callback);
				}
			});
		}
		/*#end*/
	},


	/**
	 * @ignore
	 * */
	"_afterLoad": function(dbres, callback){
		var c, L, v, gsid, gslv,
			lvs = [2, 4, 6],
			self = this,
			gandsRef = Object.create(null),
			dataRefByGSIDGroup = Object.create(null);

		self.data = dbres.data;
		self.state = 1;

		for(c=0; c<self.data.length; c++){
			gandsRef[self.data[c].GSID] = self.data[c];
			if (!self.data[c].gandsExtRef) self.data[c].gandsExtRef = [];
			if (!self.data[c].gandsPropertiesRef) self.data[c].gandsPropertiesRef = [];
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

		for (c = 0, L = self.data.length; c < L; c++) {
			if (typeof self.GSUnits[self.data[c].GSID] == "undefined")
				self.GSUnits[self.data[c].GSID] = self.data[c].GSUnit;

			gsid = self.data[c].GSID;

			for (v = 0; v < lvs.length; v++) {
				gslv = gsid.substr(0, lvs[v]);

				if (gslv.length == lvs[v]) {
					if (!dataRefByGSIDGroup[gslv]) dataRefByGSIDGroup[gslv] = [];

					dataRefByGSIDGroup[gslv].push(self.data[c]);
				}
			}
		}

		self.dataReferences = new ObjectA(gandsRef);
		self.dataRefByGSID = self.dataReferences;
		self.dataRefByGSIDGroup = new ObjectA(dataRefByGSIDGroup);

		// -------------------------------------------------------------------------------------

		var proto = Object.getPrototypeOf(self);

		/** @deprecated */
		// TODO: Сильная привязка к кодам. Найти все упоминания в проектах и произвести рефакторинг
		proto._matcherPatterns = [
			  {"GS":/пзраф/gi,"gr":"production:folding"}
			, {"GS":/тцбуд1|тцбуд3|тцбукр|тцбупр/gi,"gr":"carton"}
			, {"GS":/пзрала/gi,"gr":"production:laminating"}
			, {"GS":/пзрапз/gi,"gr":"production:cutting"}
			, {"GS":/тцбуко/,"gr":"envelope"}
			, {"GS":/пзрапо/gi,"gr":"production:rounding"}
			, {"GS":/тцмп/gi,"gr":"materials:print"}
			, {"GS":/гпсупп/gi,"gr":"pens"}
			, {"COP":/17|27|07/ig,"gr":"print"}
			, {"GS":/пзраби/gi,"gr":"production:creasing"}
			, {"GS":/тцбукм/gi,"gr":"materials:carton:regular"}
			, {"GS":/тцбуме/gi,"gr":"materials:paper:coated"}
			, {"GS":/тцбукм|тцдк/gi,"gr":"materials:carton"}
			, {"GS":/^ТСFM$/,"gr":"fom-config"}
			, {"GS":/тцбуоф/gi,"gr":"materials:paper:offset"}
			, {"GS":/тцбуме|тцбуоф|тцбуса|тцбуск|тцбуцп|тцбуфб/gi,"gr":"paper"}
			, {"GS":/ТСПоФм/ig,"gr":"print-formats"}
			, {"GS":/^тцбу+[a-z-0-9]{1,}/ig,"gr":"material-paper"}
			, {"GS":/тцдк/gi,"gr":"materials:carton:design"}
			, {"COP":/((^17$)|^17|^27$|^27)+[0-5,7-9]/ig,"gr":"products"}
			, {"COP":/((^17$)|^17|^27$|^27)+[0-5,7-9]/ig,"gr":"products:print"}
		];

		// -------------------------------------------------------------------------------------

		self._buildIndexData();

		callback(null, self);
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
		var priorPropsObj;
		var props_;
		var gsRow;
		var prop;
		var row_;
		var c;
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

		if (_utils.getType(props) == "array") {

		} else if (typeof props == "string") {
			props = [props];

		} else {
			props = [];
		}

		props_ = [];
		row_ = row;

		for (c = 0; c < props.length; c++) {
			if (typeof props[c] != "string")
				continue;

			props_[c] = props[c].toLowerCase();
		}

		do {
			if (!props_.length) {
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

		if (options.onlyPriority) {
			priorPropsObj = {};

			for (c = 0; c < ret.length; c++) {
				gsRow = ret[c];
				prop = gsRow.property;

				if (!priorPropsObj[prop] || priorPropsObj[prop][0].extID.length < gsRow.extID.length) {
					priorPropsObj[prop] = [gsRow];

				} else {
					priorPropsObj[prop].push(gsRow);
				}
			}

			ret = [];

			Object.values(priorPropsObj).forEach(function(arr) {
				ret.push.apply(ret, arr);
			});
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