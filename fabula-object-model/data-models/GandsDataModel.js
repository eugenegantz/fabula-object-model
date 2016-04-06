// ------------------------------------------------------
// Номенклатура

var ObjectA = require("./ObjectA");

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

		this._indexData = {};

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
		var callback = (typeof arg.callback == "function" ? arg.callback : function(){} );
		var self = this;

		/*#if browser,node*/
		// Номеклатура
		var dbq = [
			"SELECT * FROM Gands " 		+
			"WHERE "							+
			"GSCOP LIKE '87%' "			+
			"OR GSCOP LIKE '17%' "		+
			"OR GSCOP LIKE '27%' "		+
			"OR GSCOP LIKE '07%' "		+
			"OR GSID LIKE 'ТСПо%' "
		];

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
		/*#end*/

		/*  #if browser-s */
		if (typeof window == "object" && typeof document == "object"){
			var Ajax = require("./../browser/Ajax");
			Ajax.req({
				"url": self._fabulaInstance.url,
				"method": "POST",
				"data": {
					model: "GandsDataModel"
				},
				"callback": function(http){
					self._afterLoad(JSON.parse(http.responseText), callback);
				},
				"onerror": function(){
					callback("http.status = " + http.status);
				}
			});
		}
		/*  #end */

		/* #if browser,node */
		var db = getContextDB.call(this);
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
				}
			});
		}
		/*  #end */
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
			self.data[c].gandsExtRef = [];
			self.data[c].gandsPropertiesRef = [];
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

			var tmp = [];

			// Печатные форматы форматы
			if (  row.GSID.match(/ТСПоФм/gi)  ) {
				tmp.push("print-formats");
			}

			// Соответсвует ТМЦ / Бумага
			// Сюда могут быть включены: картон, самокопирка и пр.
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


	/**
	 * @param {Object} arg
	 * @param {Array} arg.cop - Массив из RegExp для поиска среди КОПов
	 * @param {Array} arg.type
	 * */
	"get" : function(arg){
		if (typeof arg != "object") arg = Object.create(null);
		var type = typeof arg.type != "object" ? [] : arg.type;
		if (toString.call(arg.group) == "[object Array]") type = arg.group;
		var cop = typeof arg.cop != "object" ? [] : arg.cop;

		if (!type.length && !cop.length) return this.data;

		var tmp = [], c, v, match;

		if (type.length == 1 && !cop.length){
			if (  typeof this._indexData[type[0]] != "object"  ){
				return [];
			}
			return this._indexData[type[0]];
		}

		for (c = 0; c < this.data.length; c++) {

			if (  tmp.indexOf(this.data[c]) > -1  ) continue;

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