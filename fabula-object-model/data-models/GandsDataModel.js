"use strict";

// ------------------------------------------------------
// Номенклатура

var ObjectA = require("./ObjectA");
var _utils = require("./../utils");

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
	this.init();
};

GandsDataModel.prototype = {
	"init" : function(){

		this.dbModel = null;

		this.data = [];

		this.instances.push(this);

		this.GSUnits = Object.create(null);

		this.state = 0;

		this._init_timestamp = null;

		this._indexData = {}; // after init => Object

	},

	"instances" : [],

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
	"load" : function(arg){
		if (typeof arg == "undefined") arg = Object.create(null);
		var useCache = typeof arg.useCache == "undefined" ? true : Boolean(arg.useCache);
		var callback = typeof arg.callback == "function" ? arg.callback : function(){};
		var self = this;

		var db = getContextDB.call(this);
		var configRow = {"GSID": "ТСFM", "GSName": "Настройки FOM", gandsPropertiesRef: []};

		// TODO брать коды инициализации из настроек

		/*#if browser,node*/
		// Номеклатура
		db.query({
			"query": "SELECT pid, extID, property, value FROM Property WHERE ExtID = 'ТСFM' ",
			"callback": function(dbres){

				// Конфиг по-умолчанию
				var dbq = [
					"SELECT * FROM Gands " 		+
					"WHERE "							+
					"GSCOP LIKE '87%' "			+
					"OR GSCOP LIKE '17%' "		+
					"OR GSCOP LIKE '27%' "		+
					"OR GSCOP LIKE '07%' "		+
					"OR GSID LIKE 'ТСПо%' "
				];

				if (dbres.recs.length){
					for(var c=0; c<dbres.recs.length; c++){
						// Запрос из конфига
						if (dbres.recs[c].property == "запрос-номенклатура"){
							dbq[0] = "SELECT * FROM Gands WHERE " + dbres.recs[c].value;
						}
						configRow.gandsPropertiesRef.push(dbres.recs[c]);
					}
				}

				// Расширение номенклатуры
				dbq.push(
					"SELECT * FROM GandsExt "				+
					"WHERE "										+
					"GSExID IN ("									+
					dbq[0].replace(/[*]/gi, "GSID")			+
					")"
				);

				// Свойства номенклатуры
				dbq.push(
					"SELECT pid, extID, property, value FROM Property "	+
					"WHERE "																+
					"ExtID IN ("															+
					dbq[0].replace(/[*]/gi, "GSID")									+
					")"
				);

				if (db){
					db.dbquery({
						"query" : dbq.join("; "),
						"callback" : function(res){
							self._afterLoad(
								{
									"data": res[0].recs,
									"ext": res[1].recs,
									"props": res[2].recs
								},
								callback
							);
							self._init_timestamp = Date.now();
						}
					});
				}


			}
		});
		/*#end*/

		/*  #if browser-s */
		if (  _utils.isBrowser()  ){
			var Ajax = require("./../browser/Ajax");
			Ajax.req({
				"url": self._fabulaInstance.url,
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
					self._afterLoad(JSON.parse(http.responseText), callback);
				}
			});
		}
		/*#end*/
	},


	/**
	 * @ignore
	 * */
	"_afterLoad": function(dbres, callback){
		var self = this;
		self.data = dbres.data;
		self.state = 1;

		var c, L, gandsRef = Object.create(null);

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

		for(c= 0, L=self.data.length; c<L; c++){
			if (typeof self.GSUnits[self.data[c].GSID] == "undefined") {
				self.GSUnits[self.data[c].GSID] = self.data[c].GSUnit
			}
		}

		self.dataReferences = new ObjectA(gandsRef);

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
	"_groupMatcher": function(row){

		// TODO брать коды из ссылок

		var tmp = [];

		// Печатные форматы форматы
		if (  row.GSID.match(/ТСПоФм/gi)  ) {
			tmp.push("print-formats");
		}

		// Соответсвует ТМЦ / Бумага
		// Сюда могут быть включены: картон, самокопирка и пр.
		// TODO a.match(/^тцбу+[a-z-0-9]{1,}/ig)
		if (
			row.GSID.toLowerCase().match(/тцбу/gi)
			&& row.GSID.length > 4
		) {
			tmp.push("material-paper");
		}

		// Выбирает из ТМЦ / Бумага только конкретно бумагу
		if (  row.GSID.toLowerCase().match(/тцбуме|тцбуоф|тцбуса|тцбуск|тцбуцп|тцбуфб/gi)  ) {
			tmp.push("paper");
		}

		// materials:paper:offset
		if (  row.GSID.match(/тцбуоф/gi)  ){
			tmp.push("materials:paper:offset");
		}

		// materials:paper:coated
		if (  row.GSID.match(/тцбуме/gi)  ){
			tmp.push("materials:paper:coated");
		}

		// materials:carton
		if (  row.GSID.match(/тцбукм|тцдк/gi)  ){
			tmp.push("materials:carton")
		}

		// materials:carton:regular
		if (  row.GSID.match(/тцбукм/gi)  ){
			tmp.push("materials:carton:regular")
		}

		// paper:carton:design
		if (  row.GSID.match(/тцдк/gi)  ){
			tmp.push("materials:carton:design")
		}

		// production:lamination
		if (  row.GSID.match(/пзрала/gi)  ){
			tmp.push("production:laminating");
		}

		// production:cutting
		if (  row.GSID.match(/пзрапз/gi)  ){
			tmp.push("production:cutting");
		}

		// production:creasing
		if (  row.GSID.match(/пзраби/gi)  ){
			tmp.push("production:creasing");
		}

		// production:rounding
		if (  row.GSID.match(/пзрапо/gi)  ){
			tmp.push("production:rounding");
		}

		// production:folding
		if (  row.GSID.match(/пзраф/gi)  ){
			tmp.push("production:folding");
		}

		if (  row.GSID.match(/тцмп/gi)  ){
			if (
				row.GSID.match(/тцмпбг|тцмпкк|тцмпкл|тцмпкр|тцмпкт|тцмпрс|тцмпс1|тцмпск|тцмпто/gi)
				|| row.GSID.length <= 6
			){
				// return false;
			} else {

			}
			tmp.push("materials:print");
		}

		if (  row.GSID.toLowerCase().match(/тцбуд1|тцбуд3|тцбукр|тцбупр/gi)  ) {
			tmp.push("carton");
		}

		if (  row.GSID.toLowerCase().match(/тцбуко/)  ) {
			tmp.push("envelope");
		}

		if (
			row.GSCOP.match(/17/)
			|| row.GSCOP.match(/27/)
		) {
			if (!row.GSCOP.match(/276|176/)) {
				tmp.push("products");
			}
		}

		if (
			row.GSCOP.match(/17/)
			|| row.GSCOP.match(/27/)
			|| row.GSCOP.match(/07/)
		) {
			tmp.push("print");
		}

		if (
			row.GSCOP.match(/17/)
			|| row.GSCOP.match(/27/)
		) {
			if (!row.GSCOP.match(/276|176/)) {
				tmp.push("products:print");
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


	"getJSON": function(){
		var ret = Object.create(null);
		ret.data = this.data;
		ret.GSUnits = this.GSUnits;
		return ret
	}

};

module.exports = GandsDataModel;