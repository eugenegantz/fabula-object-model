// ------------------------------------------------------
// Данные из базы о предприятиях

// Для совместимости
var getContextDB = function(){
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype.DBModel;

	if (  this._fabulaInstance ){
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};

var FirmsDataModel = function(){
	this.init();
};

FirmsDataModel.prototype = {
	"init" : function(){

		this.dbModel = null;

		this.data = [];

		this.instances.push(this);

		this.state = 0;

	},

	"instances" : [],

	"getInstance" : function(){
		if (this.instances.length){
			return this.instances[0];
		}
		return new FirmsDataModel();
	},

	"load" : function(A){
		if (typeof A == "undefined") A = Object.create(null);
		var callback = (typeof A.callback == "function" ? A.callback : function(){} );
		var db = getContextDB.call(this);
		var self = this;
		if (db){
			db.dbquery({
				"query" : "SELECT FirmID, Name FROM Firms",
				"dbsrc" : "common",
				"callback" : function(res){
					self.data = res.recs;
					self.state = 1;
					callback(self.data);
				}
			});
		}
	},

	"get" : function(){
		return this.data;
	}
};

module.exports = FirmsDataModel;