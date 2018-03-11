"use strict";

var movDBTScm           = require("./db-tables-schemes/movement.js"),
    DefaultDataModel    = require("./DefaultDataModel"),
    InterfaceFProperty  = require("./InterfaceFProperty"),
    IMovCollection      = require("./IMovCollection.js"),
    TalksDataModel      = require("./TalksDataModel"),
    IFabModule          = require("./IFabModule.js"),
    ObjectA             = require("./ObjectA.js"),
    emptyFn             = function() {},
    dbUtils             = require("./../utils/dbUtils.js"),
    _utils              = require("./../utils/utils");


function MMovCollection() {

}


MMovCollection.prototype = _utils.createProtoChain(
	DefaultDataModel.prototype,
	InterfaceFProperty.prototype,
	IFabModule.prototype,
	IMovCollection.prototype,
	{

		"mkLoadSQLQuery": function(arg) {
			arg = arg || {};

			var where,
			    filters = arg.filters || {};

			var fields = arg.fields;

			if (_utils.isEmpty(fields)) {
				fields = [
					"MMID",
					"MMPID",
					"ParentDoc",
					"Doc",
					"Doc1",
					"GS",
					"GSSpec",
					"MMFlag",
					"Amount",
					"Sum",
					"Sum2",
					"Price",
					"CodeOp",
					"Performer",
					"Manager2",
					"Agent2",
					"Format(GSDate,'yyyy-mm-dd Hh:Nn:Ss') as GSDate"
				];
			}

			fields = fields.map(function(fld) {
				if (/[()]/g.test(fld))
					return fld;

				fld = (fld + '').toLowerCase();

				return "[" + fld + "]";
			});

			where = arg.where || Object.keys(filters).map(function(key) {
				var val = [].concat(filters[key] || []);

				return val.map(function(val) {
					return dbUtils.mkVal(val, movDBTScm.get(key));
				}).join(",");
			}, []);

			where = where.join(" AND ");

			var _queryMovs = ""
				+ " SELECT _fld_"
				+ " FROM Movement"
				+ " WHERE " + where;

			var queryMovs = _queryMovs.replace("_fld_", fields.join(","));

			var queryProps = ""
				+ " SELECT"
				+ "   uid"
				+ " , pid"
				+ " , ExtClass"
				+ " , ExtID"
				+ " , property"
				+ " , [value]"
				+ " FROM Property"
				+ " WHERE"
				+ " "
		},


		"loadFromDBRes": function(dbres) {

		},


		"load": function(arg) {
			var db = this.getDBInstance(),
			    query = this.mkLoadSQLQuery(arg);

			return db.dbquery({ "query": query }).then(function() {

			})
		}

	}
);