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

		var _this            = this;
		var mmId            = arg.MMID;
		var message         = arg.message || "";
		var nextMMFlag      = arg.MMFlag || "";
		var agent           = arg.agent || 999;
		var callback        = arg.callback || voidFn;
		var db              = getContextDB.call(this);

		return Promise.resolve().then(function() {
			return db.auth();

		}).then(function() {
			if (!db)
				return Promise.reject("TalksDataModel.postTalk(): !db");

			if (!mmId)
				return Promise.reject("TalksDataModel.postTalk(): !arg.mmid");

			var knex            = db.getKnexInstance();
			var msg             = message.match(new RegExp(".{1," + (_this.STR_LIMIT - 1) + "}(\\s|$)|.{1," + _this.STR_LIMIT + "}", "g")) || [];
			var keyRandStr      = utils.string.random(20);

			// Если сообщений нет, но необходимо записать смену фазы - записать пустую строку
			!msg.length && nextMMFlag && msg.push("");

			var query = msg.reduce(function(str, msg, idx) {
				msg = utils.db.secureStr(msg).replace("'", "\\'");

				var query = knex.queryBuilder();

				if (!idx && nextMMFlag) {
					query.into(knex.functionHelper.insertInto('Talk', ['dt', 'txt', 'agent', 'mm', 'doc', 'tm', 'key', 'part']));

					query.insert(function() {
						this.from("Movement");
						this.select(
							  knex.functionHelper.now()
							, knex.functionHelper.concat("Фаза: ", knex.functionHelper.columnize('mmFlag'), " &rArr; ", nextMMFlag, (msg ? "<br>" + msg : ""))
							, agent
							, 'mmid'
							, 'doc1'
							, knex.functionHelper.format(knex.functionHelper.now(), "hh:mm")
							, keyRandStr
							, idx
						);
						this.where("mmId", mmId);
					});

					return query.toString();
				}

				query.into(knex.functionHelper.insertInto('Talk', ['dt', 'txt', 'agent', 'mm', 'doc', 'tm', 'key', 'part']));

				query.insert(function() {
					this.from("Movement");
					this.select(
						knex.functionHelper.now()
						, msg
						, agent
						, 'mmid'
						, 'doc1'
						, knex.functionHelper.format(knex.functionHelper.now(), "hh:mm")
						, keyRandStr
						, idx
					);
					this.where("mmId", mmId);
				});

				return query.toString();
			}, "");

			if (!query)
				return;

			return (
				db.query({
					"dbworker": " ",
					"query": query,
					"dbcache": _this.iFabModuleGetDBCache(arg.dbcache, { "m": "m-talk.post" }),
				})
			);

		}).then(function() {
			callback(null, _this);

		}).catch(function(err) {
			callback(err, _this);
		});
	},


	"getInstance": function() {
		return this.instances[0] || new TalksDataModel();
	}

});

module.exports = TalksDataModel;