"use strict";

var utils = require("./../utils/utils"),
	dbUtils = require("./../utils/dbUtils.js"),
	voidFn = function() {};

// Для совместимости
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js"),
		DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance)
		return this._fabulaInstance.getDBInstance();

	return DBModel.prototype.getInstance();
};

var TalksDataModel = function() {
	this.instances.push(this);
};


TalksDataModel.prototype = {

	"instances": [],


	"STR_LIMIT": 250,


	"postTalk": function(arg) {
		arg = arg || {};

		var self            = this,
			mmId            = arg.MMID,
			message         = arg.message || "",
			nextMMFlag      = arg.MMFlag || "",
			agent           = arg.agent || 999,
			callback        = arg.callback || voidFn,
			db              = getContextDB.call(this);

		return new Promise(function(resolve, reject) {
			if (!db)
				return reject("TalksDataModel.postTalk(): !db");

			if (!mmId)
				return reject("TalksDataModel.postTalk(): !arg.mmid");

			var msg = message.match(new RegExp(".{1," + (self.STR_LIMIT - 1) + "}(\\s|$)|.{1," + self.STR_LIMIT + "}", "g")) || [];

			// Если сообщений нет, но необходимо записать смену фазы - записать пустую строку
			!msg.length && nextMMFlag && msg.push("");

			var query = msg.reduce(function(str, msg, idx) {
				msg = dbUtils.secureStr(msg).replace("'", "\\'");

				if (!idx && nextMMFlag) {
					return str + ""
						+ " INSERT INTO Talk (Dt, Txt, Agent, [MM], [Tm], [Key], [part])"
						+ " SELECT"
						+   " DATE()"
						+   " ," + "'Фаза: ' & mmFlag & ' &rArr; " + nextMMFlag + (msg ? "<br>" + msg : "") + "'"
						+   " ," + agent
						+   " ," + "mmId"
						+   " ," + "FORMAT(TIME(),'HH:MM')"
						+   " ," + "NOW()"
						+   " ," + idx
						+ " FROM Movement"
						+ " WHERE"
						+   " mmId = " + mmId
						+ ";";
				}

				return str + ""
					+ " INSERT INTO Talk (Dt, Txt, Agent, [MM], [Tm], [Key], [part])"
					+ " VALUES ("
					+   " DATE()"
					+   " ," + "'" + msg + "'"
					+   " ," + agent
					+   " ," + mmId
					+   " ," + "FORMAT(TIME(),'HH:MM')"
					+   " ," + "NOW()"
					+   " ," + idx
					+ " );";
			}, "");

			if (!query)
				return resolve();

			db.dbquery({
				"query": query,
				"callback": function(dbres, err) {
					if (err = dbUtils.fetchErrStrFromRes(dbres))
						return reject(err);

					resolve();
				}
			});

		}).then(function() {
			callback(null, self);

		}).catch(function(err) {
			callback(err, self);
		});
	},


	"getInstance": function() {
		return this.instances[0] || new TalksDataModel();
	}

};

module.exports = TalksDataModel;