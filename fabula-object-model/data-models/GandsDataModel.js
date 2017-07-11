"use strict";

// ------------------------------------------------------
// Номенклатура

var voidFn = function() {},
	DefaultDataModel = require("./DefaultDataModel"),
	IEvents = require("./InterfaceEvents"),
	ObjectA = require("./ObjectA"),
	utils = require("./../utils/utils"),
	dbUtils = require('./../utils/dbUtils.js');

// Для совместимости
var getContextDB = function() {
	var FabulaObjectModel = require("./../_FabulaObjectModel.js"),
		DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (this._fabulaInstance)
		return this._fabulaInstance.getDBInstance();

	return DBModel.prototype.getInstance();
};


/**
 * @constructor
 * */
var GandsDataModel = function() {
	this.init();
};


GandsDataModel.prototype = utils.createProtoChain(IEvents, {
	"init": function() {
		this.dbModel            = null;
		this.data               = [];
		this.GSUnits            = Object.create(null);
		this.state              = 0;
		this._init_timestamp    = null;
		this._indexData         = {}; // after init => Object

		this.instances.push(this);
	},


	"instances": [],


	_knownGSUnits: {
		"ед": {
			"type": 'num',
			"val": 1
		},
		"шт": {
			"type": 'num',
			"val": 1
		},
		"шт.": {
			"type": 'num',
			"val": 1
		},
		"1000 шт.": {
			"type": 'num',
			"val": 1000
		}
	},


	/**
	 * @return {GandsDataModel}
	 * */
	"getInstance": function() {
		return this.instances[0] || new GandsDataModel();
	},


	/**
	 * @param {Object} arg
	 * @param {Function} arg.callback
	 * */
	"load": function(arg) {
		arg = arg || {};

		var useCache    = typeof arg.useCache == "undefined" ? true : !!arg.useCache,
			callback    = arg.callback || voidFn,
			self        = this,

			db = getContextDB.call(this),

			configRow = {
				"GSID": "ТСFM",
				"GSName": "Настройки FOM",
				"GSKindName": "",
				"GSCOP": ""
			},

			configRowProps = [];

		/*#if browser,node*/
		// Номеклатура
		db.dbquery({
			"query": ""
			+ " SELECT"
			+   " pid,"
			+   " extID,"
			+   " property,"
			+   " value"
			+ " FROM Property"
			+ " WHERE"
			+   " ExtID IN("
			+       " SELECT"
			+       " [value]"
			+       " FROM Property"
			+       " WHERE"
			+           " extClass = 'config'"
			+           " AND property = 'fom-config-entry-gsid'"
			+ ")",

			"callback": function(dbres, err) {
				if (err = dbUtils.fetchErrStrFromRes(dbres))
					return callback(err);

				// Конфиг по-умолчанию
				var dbq = [""
					+ " SELECT * FROM Gands"
					+ " WHERE "
					+   " GSCOP LIKE '87%'"
					+   " OR GSCOP LIKE '17%'"
					+   " OR GSCOP LIKE '27%'"
					+   " OR GSCOP LIKE '07%'"
					+   " OR GSID LIKE 'ТСПо%'"
				];

				dbres.recs.forEach(function(row) {
					// Запрос из конфига
					if ("запрос-номенклатура" == row.property)
						dbq[0] = "SELECT * FROM Gands WHERE " + row.value;

					configRowProps.push(row);
				});

				// На случай если необходимо переопределить запрос на уровне проекта
				if (self.sql)
					dbq[0] = self.sql;

				// Расширение номенклатуры
				dbq.push(""
					+ " SELECT * FROM GandsExt"
					+ " WHERE"
					+   " GSExID IN ("
					+       dbq[0].replace(/[*]/gi, "GSID")
					+   ")"
				);

				// Свойства номенклатуры
				dbq.push(""
					+ " SELECT"
					+   " pid,"
					+   " extID,"
					+   " property,"
					+   " value"
					+ " FROM Property"
					+ " WHERE"
					+   " ExtID IN ("
					+       dbq[0].replace(/[*]/gi, "GSID")
					+   ")"
				);

				if (db) {
					db.dbquery({
						"query": dbq.join(";"),
						"callback": function(res) {
							self._afterLoad(
								{
									"data": res[0].recs.concat(configRow),
									"ext": res[1].recs,
									"props": res[2].recs.concat(configRowProps)
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
		if (utils.isBrowser()) {
			var Ajax = require("./../browser/Ajax.js");

			Ajax.req({
				"url": self._fabulaInstance.url,
				"method": "POST",
				"data": {
					"model": "GandsDataModel",
					"argument": {
						"useCache": useCache
					}
				},
				"callback": function(err, http) {
					if (err)
						return callback(err);

					self._afterLoad(JSON.parse(http.responseText), callback);
				}
			});
		}
		/*#end*/
	},


	/**
	 * @ignore
	 * */
	"_afterLoad": function(dbres, callback) {
		var lvs = [2, 4, 6],
			self = this,
			gandsProps = dbres.props,
			gandsExt = dbres.ext,
			gandsRef = Object.create(null),
			dataRefByGSIDGroup = Object.create(null);


		self.data = dbres.data;
		self.state = 1;

		// ---------------------------------

		self.data.forEach(function(row) {
			gandsRef[row.GSID] = row;

			if (!row.gandsExtRef)
				row.gandsExtRef = [];

			if (!row.gandsPropertiesRef)
				row.gandsPropertiesRef = [];
		});

		// ---------------------------------

		gandsExt.forEach(function(row) {
			if (!gandsRef[row.GSExID])
				return;

			gandsRef[row.GSExID].gandsExtRef.push(row);
		});

		// ---------------------------------

		gandsProps.forEach(function(row) {
			if (!gandsRef[row.extID])
				return;

			gandsRef[row.extID].gandsPropertiesRef.push(row);
		});

		// ---------------------------------

		self.data.forEach(function(row) {
			var v,
				gslv,
				gsid = row.GSID;

			if (typeof self.GSUnits[gsid] == "undefined")
				self.GSUnits[gsid] = row.GSUnit;

			for (v = 0; v < lvs.length; v++) {
				gslv = gsid.substr(0, lvs[v]);

				if (gslv.length == lvs[v]) {
					if (!dataRefByGSIDGroup[gslv])
						dataRefByGSIDGroup[gslv] = [];

					dataRefByGSIDGroup[gslv].push(row);
				}
			}
		});

		// ---------------------------------

		self.dataReferences = new ObjectA(gandsRef);
		self.dataRefByGSID = self.dataReferences;
		self.dataRefByGSIDGroup = new ObjectA(dataRefByGSIDGroup);

		// ---------------------------------

		var proto = Object.getPrototypeOf(self);

		proto._matcherPatterns = [];

		var configRow = self.dataReferences.get("ТСFM");

		if (configRow) {
			// Заполнение недостающих полей в configRow
			self.data.length && Object.keys(self.data[0]).forEach(function(k) {
				if (configRow[k] === void 0)
					configRow[k] = "";
			});

			configRow.gandsPropertiesRef.forEach(function(row) {
				if ("номенклатура-группы" == row.property)
					proto._matcherPatterns = proto._matcherPatterns.concat(eval("(" + row.value + ")"));
			});
		}

		// ---------------------------------

		self._buildIndexData();

		callback(null, self);
	},


	"_buildIndexData": function() {
		this._indexData = {};

		this.data.forEach(function(row) {
			var v,
				m,
				match = this._groupMatcher(row);

			for (v = 0; v < match.length; v++) {
				m = match[v];

				if (typeof this._indexData[m] != "object")
					this._indexData[m] = [];

				this._indexData[m].push(row);
			}
		}, this);
	},


	/**
	 * @ignore
	 * */
	"_matcherPatterns": [],


	/**
	 * @ignore
	 * */
	"_groupMatcher": function(row) {
		var c,
			tmp = [];

		for (c = 0; c < this._matcherPatterns.length; c++) {
			if (
				this._matcherPatterns[c].GS
				&& row.GSID.match(this._matcherPatterns[c].GS)
			) {
				tmp.push(this._matcherPatterns[c].gr);

			} else if (
				this._matcherPatterns[c].COP
				&& row.GSCOP.match(this._matcherPatterns[c].COP)
			) {
				tmp.push(this._matcherPatterns[c].gr);
			}
		}

		return tmp;
	},


	"_isDraft": function(row) {
		return Boolean(row.GSName.match(/^[*]/gi) || row.GSKindName.match(/^[*]/gi));
	},


	/**
	 * Получить родительскую запись
	 * @param {Object | String} row
	 * return {Object}
	 * */
	"getParent": function(row) {
		if (utils.getType(row) == "object" && row.GSID)
			return this.dataReferences.get(row.GSID.slice(0, -2));

		if (typeof row == "string") {
			row = this.dataReferences.get(row);

			if (row && row.GSID.length >= 4)
				return this.dataReferences.get(row.GSID.slice(0, -2));
		}
	},


	/**
	 * Получить данные из таблицы расширения номенклатуры GandsExt
	 * @param {Object | String} row
	 * @param {Object=} fld
	 * @param {Object=} opt
	 * */
	"getExt": function(row, fld, opt) {
		if (utils.getType(row) == "object" && row.GSID){
			row = this.dataReferences.get(row.GSID);

		} else if (utils.getType(row) == "string") {
			row = this.dataReferences.get(row);

		} else {
			throw new Error("1st argument suppose to be String or Object");
		}

		if (!row)
			return [];

		if (fld && typeof fld != "object")
			throw new Error("2nd argument supposed to be type Object");

		opt = opt || {};

		var res = !fld
			? row.gandsExtRef
			: this._fetchRowExtFields(row, fld);

		res = res.concat(
			this.getExt(
				this.getParent(row) || '',
				fld,
				Object.assign({}, opt, { onlyPriority: false })
			) || []
		);

		if (opt.onlyPriority) {
			var ex = {};

			res = res.sort(function(a, b) {
				return a.GSExID.length > b.GSExID.length ? -1 : 1;
			}).filter(function(extRow) {
				var key = extRow.GSExType + extRow.GSExName;

				// Если такой ключ уже был и этот ключ лежит в таблице с меньшим весом - исключить его из выборки
				// (чтобы избежать выбрасывания родственников из одной таблицы)
				if (ex[key] && extRow.GSExID.length < ex[key])
					return false;

				return ex[key] = extRow.GSExID.length;
			});
		}

		return res;
	},


	"_fetchRowExtFields": function(row, fld) {
		fld = ObjectA.create(fld);

		return row.gandsExtRef.filter(function(extRow) {
			extRow = ObjectA.create(extRow);

			return fld.getKeys().every(function(key) {
				return extRow.get(key) == fld.get(key);
			});
		});
	},


	/**
	 * Получить свойства записи. Собственные и наследуемые
	 * @param {Object | String} argRow - код либо объект (строка) из номенклатуры
	 * @param {Array | String=} argProps - перечень свойств
	 * @param {Object=} opt - параметры выборки
	 * @param {Boolean} opt.onlyPriority
	 * @return {undefined | Array}
	 * */
	"getProperty": function(argRow, argProps, opt) {
		if (utils.getType(argRow) == "object" && argRow.GSID) {
			argRow = this.dataReferences.get(argRow.GSID);

		} else if (utils.getType(argRow) == "string") {
			argRow = this.dataReferences.get(argRow);

		} else {
			throw new Error("1st argument suppose to be String or Object");
		}

		opt = opt || {};

		var ex,
			ret = [],
			gsRow = argRow;

		if (utils.getType(argProps) != "array")
			argProps = [argProps + ""];

		argProps = argProps.reduce(function(obj, str) {
			obj[str.toLowerCase()] = 1;

			return obj;
		}, {});

		do {
			!argProps.length
				? ret.push.apply(ret, gsRow.gandsPropertiesRef)
				: gsRow.gandsPropertiesRef.forEach(function(propRow) {
					argProps[propRow.property.toLowerCase()] && ret.push(propRow);
				});

		} while (gsRow = this.getParent(gsRow));

		if (opt.onlyPriority) {
			ret = ret.sort(function(a, b) {
				return a.extID.length > b.extID.length ? -1 : 1;
			}).filter(function(propRow) {
				var prop = propRow.property;

				if (ex[prop] && ex[prop].extID.length > propRow.extID.length)
					return false;

				return !!(ex[prop] = propRow);
			});
		}

		return ret;
	},


	/**
	 * @param {Object} arg
	 * @param {Array} arg.cop - Массив из RegExp для поиска среди КОПов
	 * @param {Array} arg.type
	 * */
	"get": function(arg) {
		if (typeof arg != "object") arg = Object.create(null);

		var type = utils.getType(arg.type) == "array" ? arg.type : [];

		if (utils.getType(arg.group) == "array") type = arg.group;

		var cop = utils.getType(arg.cop) == "array" ? arg.cop : [],
			flags = utils.getType(arg.flags) == "array" ? arg.flags : [],
			useDraft = typeof arg.useDraft == "undefined" ? true : Boolean(arg.useDraft);

		if (!type.length && !cop.length) return this.data;

		var tmp = [], c, v, match;

		if (
			type.length == 1
			&& !cop.length
			&& !flags.length
			&& useDraft
		) {
			if (typeof this._indexData[type[0]] != "object")
				return [];

			return this._indexData[type[0]];
		}

		var flagsRegEx = new RegExp(flags.join("|"));

		for (c = 0; c < this.data.length; c++) {

			if (tmp.indexOf(this.data[c]) > -1) continue;

			if (this._isDraft(this.data[c]) && !useDraft)
				continue;

			if (flags.length && !this.data[c].GSFlag.match(flagsRegEx))
				continue;

			match = this._groupMatcher(this.data[c]);

			for (v = 0; v < match.length; v++) {
				if (type.indexOf(match[v]) > -1) {
					tmp.push(this.data[c]);

					break;
				}
			}

			for (v = 0; v < cop.length; v++) {
				if (cop[v] instanceof RegExp) {
					if (this.data[c].GSCOP.match(cop[v])) {
						tmp.push(this.data[c]);
					}

				} else if (typeof cop[v].GSCOP == "string") {
					if (cop[v] == this.data[c]) {
						tmp.push(this.data[c]);
					}
				}
			}
		}

		return tmp;
	},


	"getGSUnit": function(GSID) {
		if (typeof GSID == "undefined") return;

		if (typeof this.GSUnits[GSID] == "undefined") return;

		return this.GSUnits[GSID];
	},


	"GSUnitConvert": function(from, to, value) {
		from = this._knownGSUnits[from];
		to = this._knownGSUnits[to];

		if (!to || !from)
			throw new Error("GSUnitConvert: Unknown unit type");

		if (from.type != to.type)
			throw new Error("GSUnitConvert: must be same type");

		return (+value * from.val) / to.val;
	},


	"getJSON": function() {
		var ret = Object.create(null);

		ret.data = this.data;
		ret.GSUnits = this.GSUnits;

		return ret
	},


	/**
	 * Является ли данная строка ссылкой на номенклатуру
	 * @param {String} str
	 * */
	"hasGsLinks": function(str) {
		return !!this.matchGsLinks(str).length;
	},


	/**
	 * Получить подстроки из строки, в которых содержатся ссылки на номенклатуру
	 * @param {String} str
	 * @return {Array | undefined}
	 * */
	"matchGsLinks": function(str) {
		return (str.match(/\[gs\][a-zA-Z0-9а-яА-Я]+\[\/gs\]/ig) || []).map(function(a) {
			return utils.rmGsTags(a);
		});
	},


	/**
	 * @param {String} str
	 * @param {Boolean} withNested - получить запись вместе с вложенными в нее
	 * @return {Array}
	 * */
	"parseGsLink": function(str, withNested) {
		var self = this;

		return (self.matchGsLinks(str) || []).reduce(function(prev, curr) {
			return prev.concat((
					withNested
						? self.dataRefByGSIDGroup.get(curr) || self.dataRefByGSID.get(curr)
						: self.dataRefByGSID.get(curr)
				) || [])
		}, []);
	}

});

module.exports = GandsDataModel;