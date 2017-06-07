"use strict";

var _utils = require("./../utils/utils");

// Для совместимости
var getContextDB = function(){
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (  this._fabulaInstance ){
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};

var TalksDataModel = function(){

	this.instances.push(this);
	// this.db = DBModel.prototype.getInstance();

};

TalksDataModel.prototype = {

	"instances": [],

	"postTalk": function(A){

		if (typeof A != "object") A = Object.create(null);
		// var self				= this;
		var MMID			= typeof A.MMID == "undefined" || isNaN(A.agent) ? null : parseInt(A.MMID);
		var message		= typeof A.message == "string" ? A.message : "" ;
		var newMMFlag	= typeof A.MMFlag == "string" ? A.MMFlag : "";
		var agent			= typeof A.agent == "undefiend" || isNaN(A.agent) ? 999 : A.agent ;
		var callback			= typeof A.callback == "function" ? A.callback : function(){};

		var db = getContextDB.call(this);

		if (!db) {
			callback("!db");
			console.error("!db");
			return;
		}

		if (typeof db.dbquery != "function") {
			callback("!db");
			console.error("!db");
			return;
		}

		if (!MMID) return;

		db.dbquery({
			"query": "SELECT Txt FROM Talk WHERE Txt LIKE '%&rArr;%' AND MM = " + MMID + " ORDER BY TalkID DESC",
			"callback": function(dbres){

				var err = [];

				if (dbres.info.errors){

					if (
						Array.isArray(dbres.info.errors)
						&& dbres.info.errors.length
					){
						err = err.concat(dbres.info.errors);

					} else if (  typeof dbres.info.errors == "string"  ) {
						err.push(dbres.info.errors);

					}
					callback(err);
					return;

				}

				var prevMMFlag = "";

				if (!dbres.recs.length){
					if (newMMFlag) prevMMFlag = newMMFlag;

				} else {
					prevMMFlag = dbres.recs[0].Txt.match(/(&rArr;).[0-9]/g);
					if (prevMMFlag){
						prevMMFlag = prevMMFlag[0];
						prevMMFlag = prevMMFlag[prevMMFlag.length - 1];
					}
					if (!newMMFlag) newMMFlag = prevMMFlag;
				}

				db.dbquery({
					"query": "" +
					"INSERT INTO Talk (Dt, Txt, Agent, [MM], [Tm], [Key]) " +
					"VALUES (DATE(), '"+(!newMMFlag ? "" : "Фаза: " + prevMMFlag + ' &rArr; ' + newMMFlag )+'<br>'+_utils.DBSecureStr(message)+"', "+agent+", "+MMID+",  FORMAT(TIME(),'HH:MM'), NOW())",

					"callback": function(dbres){
						if (dbres.info.errors){
							if (Array.isArray(dbres.info.errors) && dbres.info.errors.length){
								err = err.concat(dbres.info.errors);

							} else if (typeof dbres.info.errors == "string") {
								err.push(dbres.info.errors);

							}
						}
						callback(err.length ? err : null);
					}
				});

			} // close.db.callback
		});
	},


	"getTalks": function(){},


	"getInstance": function(){
		return this.instances.length ? this.instances[0] : new TalksDataModel();
	}
};

module.exports = TalksDataModel;