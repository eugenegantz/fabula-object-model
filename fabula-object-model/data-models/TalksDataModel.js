"use strict";

var IFabModule = require("./IFabModule.js"),
	voidFn = function() {};

var utils = {
	"db": require("./../utils/dbUtils.js"),
	"string": require("./../utils/string.js"),
	"common": require("./../utils/utils.js"),
};

// Для совместимости
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js"),
		DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance)
		return this._fabulaInstance.getDBInstance();

	return DBModel.prototype.getInstance();
};


var TalksDataModel = function() {
	IFabModule.call(this);

	this.instances.push(this);
};


/**
 * @param {Object} talk
 * @param {String} talk.txt
 *
 * @return {Object}
 * */
TalksDataModel.parseTalk = function(talk) {
	var flagRegEx   = /[а-яa-z0-9]{0,4}/ig;
	var arrowRegEx  = /&rArr;/i;
	var labelRegEx  = /Фаза:/i;
	var regEx       = new RegExp(labelRegEx.source + "\\s*" + flagRegEx.source + "\\s" + arrowRegEx.source + "\\s" + flagRegEx.source, "ig");
	var flagTxt     = [].concat(talk.txt.match(regEx) || []).join('').replace(labelRegEx, "");
	var bodyTxt     = talk.txt.replace(regEx, "").trim();

	var tmp         = flagTxt.split('&rArr;');
	var prevmmflag  = tmp[0] || "";
	var mmflag      = tmp[1] || "";

	prevmmflag      = prevmmflag.trim();
	mmflag          = mmflag.trim();

	return {
		  "prevmmflag"      : prevmmflag
		, "mmflag"          : mmflag
		, "txt"             : bodyTxt
		, "mmid"            : talk.mm
		, "talkid"          : talk.talkid
		, "agent"           : talk.agent
		, "docid"           : talk.doc
		, "date"            : talk.date
	}
};


/**
 * Является ли запись информации о смене фазы
 *
 * @param {Object} talk
 *
 * @return {Boolean}
 * */
TalksDataModel.isMMFlagChangeTalk = function(talk) {
	var parsed = this.parseTalk(talk);

	return !!parsed.mmflag
};


TalksDataModel.prototype = utils.common.createProtoChain(IFabModule.prototype, {

	"instances": [],


	"STR_LIMIT": 250,


	/**
	 * Записать сообщение на форум к задаче
	 *
	 * @param {Object} arg
	 * @param {String=} arg.MMFlag - код фазы
	 * @param {String=999} arg.agent - идентификатор агента от имени которого отправить запись
	 * @param {String=} arg.message - текст сообщение
	 * @param {Number} arg.MMID - идентификатор задачи
	 * @param {String | Object=} arg.dbcache
	 * @param {Function=} arg.callback
	 *
	 * @return {Promise}
	 * */
	"postTalk": function(arg) {
		arg = arg || {};

		var self            = this,
			mmId            = arg.MMID,
			message         = arg.message || "",
			nextMMFlag      = arg.MMFlag || "",
			agent           = arg.agent || 999,
			callback        = arg.callback || voidFn,
			db              = getContextDB.call(this);

		return Promise.resolve().then(function() {
			if (!db)
				return Promise.reject("TalksDataModel.postTalk(): !db");

			if (!mmId)
				return Promise.reject("TalksDataModel.postTalk(): !arg.mmid");

			var msg = message.match(new RegExp(".{1," + (self.STR_LIMIT - 1) + "}(\\s|$)|.{1," + self.STR_LIMIT + "}", "g")) || [];
			var keyRandStr = utils.string.random(20);

			// Если сообщений нет, но необходимо записать смену фазы - записать пустую строку
			!msg.length && nextMMFlag && msg.push("");

			var query = msg.reduce(function(str, msg, idx) {
				msg = utils.db.secureStr(msg).replace("'", "\\'");

				if (!idx && nextMMFlag) {
					return str + ""
						+ " INSERT INTO Talk (dt, txt, agent, [mm], [doc], [tm], [key], [part])"
						+ " SELECT"
						+   " CAST(CONCAT(FORMAT(CURRENT_TIMESTAMP, 'yyyy-MM-dd'), 'T', FORMAT(CURRENT_TIMESTAMP, 'HH:mm:ss'), '.000') AS DATETIME)"
						+   " ," + "CONCAT('Фаза: ', mmFlag, ' &rArr; ', '" + nextMMFlag + "', '" + (msg ? "<br>" + msg : "") + "')"
						+   " ," + agent
						+   " ," + "[mmid]"
						+   " ," + "[doc1]"
						+   " ," + "FORMAT(CURRENT_TIMESTAMP,'hh:mm')"
						+   " ," + "'" + keyRandStr + "'"
						+   " ," + idx
						+ " FROM Movement"
						+ " WHERE"
						+   " mmId = " + mmId
						+ ";";
				}

				return str + ""
					+ " INSERT INTO Talk (dt, txt, agent, [mm], [doc], [tm], [key], [part])"
					+ " SELECT "
					+   " CAST(CONCAT(FORMAT(CURRENT_TIMESTAMP, 'yyyy-MM-dd'), 'T', FORMAT(CURRENT_TIMESTAMP, 'HH:mm:ss'), '.000') AS DATETIME)"
					+   " ," + "'" + msg + "'"
					+   " ," + agent
					+   " ," + "[mmid]"
					+   " ," + "[doc1]"
					+   " ," + "FORMAT(CURRENT_TIMESTAMP,'hh:mm')"
					+   " ," + "'" + keyRandStr + "'"
					+   " ," + idx
					+ " FROM Movement"
					+ " WHERE"
					+   " mmId = " + mmId
					+ ";"
			}, "");

			if (!query)
				return;

			return (
				db.query({
					"dbworker": " ",
					"query": query,
					"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-talk.post" }),
				})
			);

		}).then(function() {
			callback(null, self);

		}).catch(function(err) {
			callback(err, self);
		});
	},


	"getInstance": function() {
		return this.instances[0] || new TalksDataModel();
	}

});

module.exports = TalksDataModel;