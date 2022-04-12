"use strict";

var voidFn      = function() {};
var utils       = require("./../utils/utils.js");
var ObjectA     = require("./ObjectA.js");
var IFabModule  = require("./IFabModule.js");


/**
 * Для совместимости
 * @ignore
 * */
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js"),
		DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance)
		return this._fabulaInstance.getDBInstance();

	return DBModel.prototype.getInstance();
};


/**
 * Данные из базы об агентах
 * @constructor
 * */
var AgentsDataModel = function() {
	IFabModule.call(this);

	this.init();
};

AgentsDataModel.prototype = utils.createProtoChain(IFabModule.prototype, {

	"init": function() {
		this.dbModel = null;
		this.data = [];
		this.instances.push(this);
		this.state = 0;
	},


	/**
	 * Массив экземпляров класса
	 * */
	"instances": [],


	/**
	 * Получить экземпляр класса
	 * */
	"getInstance": function() {
		return this.instances[0] || new AgentsDataModel();
	},


	/**
	 * Инициализация данных из БД
	 * */
	"load": function(arg) {
		arg = arg || {};

		var callback = arg.callback || voidFn,
			db = getContextDB.call(this),
			self = this;

		if (!db) return;
		
		// agentsPropertiesRef
		// agentsExtRef

		var query = ""
			+ " SELECT"
			+   "   gsCodeNumber   AS [AgentID]"
			+   " , importName     AS [FIO]"
			+   " , gsName         AS [NameShort]"
			+   " , importName     AS [NameFull]"
			+   " , gsCop          AS [User]"
			+   " , GSID           AS [GSID]"
			+ " FROM Gands"
			+ " WHERE"
			+   " LEFT(GSID, 4) = 'SYСо'"
			
			+ ";"
			
			+ " SELECT "
			+   " [pid], [extID], [property], [value]"
			+ " FROM Property "
			+ " WHERE "
			+   " LEFT(extid, 4) = 'SYСо'"
			
			+ ";"
			
			+ " SELECT"
			+ "   [GEIDC], [GSExType], [GSExID], [GSExSort], [GSExExtID], [GSExName]"
			+ " , [GSExNum], [GSExFlag], [GSExAttr1], [GSExAttr2], [Tick], [DateEdit]"
			+ " FROM GandsExt"
			+ " WHERE"
			+   " LEFT(gsexid, 4) = 'SYСо'";

		return db.query({
			"dbcache": self.iFabModuleGetDBCache(arg.dbcache, { "m": "m-ag.load" }),
			"query": query
		}).then(function(res) {
			var c;
			var gandsRecs = res[0].recs;
			var propsRecs = res[1].recs;
			var gandsExtRecs = res[2].recs;

			self.dataRefByGSID = ObjectA.create({});
			self.dataRefByAgentId = ObjectA.create({});
			
			self.data = gandsRecs;
			
			for (c = 0; c < self.data.length; c++) {
				var row = self.data[c];

				self.dataRefByAgentId.set(row.AgentID + "", row);
				self.dataRefByGSID.set(row.GSID, row);
				
				row.agentsPropertiesRef = [];
				row.agentsExtRef = [];
			}
			
			for (c = 0; c < propsRecs.length; c++) {
				var propRow = propsRecs[c];
				var extid = propRow.extID + "";
				var agentRow = self.dataRefByGSID.get(extid);
				
				if (!agentRow)
					continue;
				
				agentRow.agentsPropertiesRef.push(propRow);
			}
			
			for (c = 0; c < gandsExtRecs.length; c++) {
				var extRow = gandsExtRecs[c];
				var gsexid = extRow.GSExID + "";
				var agentRow = self.dataRefByGSID.get(gsexid);
				
				if (!agentRow)
					continue;
				
				agentRow.agentsExtRef.push(extRow);
			}

			self.state = 1;
			
			callback(null, self, self.data);

		}).catch(function(err) {
			console.log(err);

			callback(err, self);
		});
	},


	/**
	 * Получить инициализированные данные
	 * */
	"get": function() {
		return this.data;
	}

});

module.exports = AgentsDataModel;