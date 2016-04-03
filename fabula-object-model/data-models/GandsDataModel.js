// ------------------------------------------------------
// Номенклатура

var ObjectA = require("./ObjectA");

// Для совместимости
var getContextDB = function(){
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype.DBModel;

	if (  this._fabulaInstance ){
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};

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

	"load" : function(A){
		if (typeof A == "undefined") A = Object.create(null);
		var callback = (typeof A.callback == "function" ? A.callback : function(){} );
		var db = getContextDB.call(this);
		var self = this;

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

		if (db){
			db.dbquery({
				"query" : dbq.join("; "),
				"callback" : function(res){
					self.data = res[0].recs;
					self.state = 1;

					var c, L, gandsRef = Object.create(null);

					for(c=0; c<self.data.length; c++){
						gandsRef[self.data[c].GSID] = self.data[c];
						self.data[c].gandsExtRef = [];
						self.data[c].gandsPropertiesRef = [];
					}

					var gandsExt = res[1].recs;

					for(c=0; c<gandsExt.length; c++){
						if (  typeof gandsRef[gandsExt[c].GSExID] == "undefined"  ) continue;
						gandsRef[gandsExt[c].GSExID].gandsExtRef.push(gandsExt[c]);
					}

					var gandsProps = res[2].recs;

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

					// this._indexBuild();

					callback(self.data);
				}
			});
		}
	},


	"_indexData": {
		"material-paper": [],
		"paper": [],
		"materials:print": [],
		"carton": [],
		"envelope": [],
		"products": [],
		"print": [],
		"products:print": []
	},


	"_indexHas": function(){

	},


	"_indexBuild": function(){

	},


	"get" : function(A){
		if (typeof A != "object") A = Object.create(null);
		var type = (typeof A.type != "object" ? [] : A.type );
		var cop = typeof A.cop != "object" ? [] : A.cop;

		if (!type.length && !cop.length) return this.data;

		var tmp = [], c, v;

		for (c = 0; c < this.data.length; c++) {

			if (  tmp.indexOf(this.data[c]) > -1  ) continue;

			// Печатные форматы форматы
			if (
				type.indexOf("print-formats") > -1
				&& this.data[c].GSID.match(/ТСПоФм/gi)
			) {
				tmp.push(this.data[c]);
			}

			// Соответсвует ТМЦ / Бумага
			// Сюда могут быть включены: картон, самокопирка и пр.
			if (
				type.indexOf("material-paper") > -1
				&& this.data[c].GSID.toLowerCase().match(/тцбу/gi)
				&& this.data[c].GSID.length > 4
			) {
				tmp.push(this.data[c]);
			}

			// Выбирает из ТМЦ / Бумага только конкретно бумагу
			if (
				type.indexOf("paper") > -1
				&& this.data[c].GSID.toLowerCase().match(/тцбуме|тцбуоф|тцбуса|тцбуск|тцбуцп|тцбуфб/gi)
			) {
				tmp.push(this.data[c]);
			}

			if (
				type.indexOf("materials:print") > -1
				&& this.data[c].GSID.match(/тцмп/gi)
			){
				if (
					this.data[c].GSID.match(/тцмпбг|тцмпкк|тцмпкл|тцмпкр|тцмпкт|тцмпрс|тцмпс1|тцмпск|тцмпто/gi)
					|| this.data[c].GSID.length <= 6
				){
					continue;
				}
				tmp.push(this.data[c]);
			}

			if (
				type.indexOf("carton") > -1
				&& this.data[c].GSID.toLowerCase().match(/тцбуд1|тцбуд3|тцбукр|тцбупр/gi)
			) {
				tmp.push(this.data[c]);
			}

			if (
				type.indexOf("envelope") > -1
				&& this.data[c].GSID.toLowerCase().match(/тцбуко/)
			) {
				tmp.push(this.data[c]);
			}

			if (type.indexOf("products") > -1) {
				if (
					this.data[c].GSCOP.match(/17/)
					|| this.data[c].GSCOP.match(/27/)
				) {
					if (!this.data[c].GSCOP.match(/276|176/)) {
						tmp.push(this.data[c]);
					}
				}
			}

			if (type.indexOf("print") > -1) {
				if (
					this.data[c].GSCOP.match(/17/)
					|| this.data[c].GSCOP.match(/27/)
					|| this.data[c].GSCOP.match(/07/)
				) {
					tmp.push(this.data[c]);
				}
			}

			if (type.indexOf("products:print") > -1) {
				if (
					this.data[c].GSCOP.match(/17/)
					|| this.data[c].GSCOP.match(/27/)
				) {
					if (!this.data[c].GSCOP.match(/276|176/)) {
						tmp.push(this.data[c]);
					}
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