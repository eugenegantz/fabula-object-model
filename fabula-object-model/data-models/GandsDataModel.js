"use strict";

var MODULE_NAME = "GandsDataModel";

var IEvents     = require("./InterfaceEvents"),
	IFabModule  = require("./IFabModule.js"),
	ObjectA     = require("./ObjectA"),
	_utils      = require("./../utils/utils"),
	dbUtils     = require("./../utils/dbUtils.js"),
	voidFn      = function() {};

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
 * Коллекция номеклатуры из фабулы
 * */
var GandsDataModel = function() {
	this.init();
};

GandsDataModel.prototype = _utils.createProtoChain(
	IEvents.prototype,
	IFabModule.prototype,
	{

		"init": function() {
			this.data = [];

			this.instances.push(this);

			this.GSUnits = Object.create(null);

			this.state = 0;

			this._init_timestamp = null;

			this._indexData = {}; // after init => Object
		},


		"instances": [],


		"_knownGSUnits": {
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
		 * Получить экземпляр
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

			var self                = this,
				callback            = arg.callback || voidFn,
				useCache            = typeof arg.useCache == "undefined" ? true : !!arg.useCache,
				db                  = getContextDB.call(this),
				configRow           = { "GSID": "ТСFM", "GSName": "Настройки FOM", "GSKindName": "", "GSCOP": "" },
				configRowProps      = [];

			return new Promise(function(resolve, reject) {
				/*#if browser,node*/
				// Номеклатура
				db.dbquery({
					"dbsrc": "*main",
					"query": ""
						+ " SELECT"
						+   "  pid"
						+   ", extID"
						+   ", property"
						+   ", value"
						+ " FROM Property"
						+ " WHERE"
						+   " ExtID IN ("
						+       " SELECT [value]"
						+       " FROM Property"
						+       " WHERE"
						+           "     extClass = 'config'"
						+           " AND property = 'fom-config-entry-gsid'"
						+   ")",
					"callback": function(dbres, err) {
						if (err = dbUtils.fetchErrStrFromRes(dbres))
							return reject(err);

						// Конфиг по-умолчанию
						var dbq = [""
							+ " SELECT * FROM Gands"
							+ " WHERE"
							+   "    GSCOP LIKE '87%'"
							+   " OR GSCOP LIKE '17%'"
							+   " OR GSCOP LIKE '27%'"
							+   " OR GSCOP LIKE '07%'"
							+   " OR GSID LIKE 'ТСПо%'"
						];

						dbres.recs.forEach(function(row) {
							// Запрос из конфига
							if (row.property == "запрос-номенклатура")
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
							+   " GSExID IN (" + dbq[0].replace(/[*]/gi, "GSID") + ")"
						);

						// Свойства номенклатуры
						dbq.push(""
							+ " SELECT"
							+   "  pid"
							+   ", extID"
							+   ", property"
							+   ", value"
							+ " FROM Property "
							+ " WHERE "
							+   " ExtID IN (" + dbq[0].replace(/[*]/gi, "GSID") + ")"
						);

						if (!db)
							return reject(MODULE_NAME + ".load(): !db");

						db.dbquery({
							"dbsrc": "*main",
							"query": dbq.join(";"),
							"callback": function(dbres, err) {
								if (err = dbUtils.fetchErrStrFromRes(dbres))
									return reject(err);

								self._afterLoad(
									{
										"data": dbres[0].recs.concat(configRow),
										"ext": dbres[1].recs,
										"props": dbres[2].recs.concat(configRowProps)
									}
								);

								self._init_timestamp = Date.now();

								resolve();
							}
						});
					}
				});
				/*#end*/

				/*  #if browser-s */
				if (_utils.isBrowser()) {
					var Ajax = require("./../browser/Ajax");

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
								return reject(err);

							self._afterLoad(JSON.parse(http.responseText));

							resolve();
						}
					});
				}
				/*#end*/

			}).then(function() {
				callback(null, self);

			}).catch(function(err) {
				callback(err, self);

				return Promise.reject(err);
			});
		},


		/**
		 * @ignore
		 * */
		"_afterLoad": function(dbres, callback) {
			callback = callback || voidFn;

			var lvs                     = [2, 4, 6],

				self                    = this,

				gandsRef                = Object.create(null),
				dataRefByGSIDGroup      = Object.create(null),

				gandsExt                = dbres.ext,
				gandsProps              = dbres.props;

			self.data = dbres.data;
			self.state = 1;

			self.data.forEach(function(row) {
				gandsRef[row.GSID] = row;

				if (!row.gandsExtRef)
					row.gandsExtRef = [];

				if (!row.gandsPropertiesRef)
					row.gandsPropertiesRef = [];
			});

			// Таблица расширения
			gandsExt.forEach(function(row) {
				if (!gandsRef[row.GSExID])
					return;

				gandsRef[row.GSExID].gandsExtRef.push(row);
			});

			// Свойства номенклатуры
			gandsProps.forEach(function(row) {
				if (!gandsRef[row.extID])
					return;

				gandsRef[row.extID].gandsPropertiesRef.push(row);
			});

			// кэш по уровням.
			// кэшируются 1, 2, 3 уровни номенклатуры
			self.data.forEach(function(gsRow) {
				if (!self.GSUnits[gsRow.GSID])
					self.GSUnits[gsRow.GSID] = gsRow.GSUnit;

				var gsId = gsRow.GSID;

				lvs.forEach(function(lv) {
					var lvGSId = gsId.substr(0, lv);

					if (lvGSId.length != lv)
						return;

					if (!dataRefByGSIDGroup[lvGSId])
						dataRefByGSIDGroup[lvGSId] = [];

					dataRefByGSIDGroup[lvGSId].push(gsRow);
				});
			});

			self.dataReferences = new ObjectA(gandsRef);
			self.dataRefByGSID = self.dataReferences;
			self.dataRefByGSIDGroup = new ObjectA(dataRefByGSIDGroup);

			// -------------------------------------------------------------------------------------

			var proto = Object.getPrototypeOf(self),
				configRow = self.dataReferences.get("ТСFM");

			proto._matcherPatterns = [];

			if (configRow) {
				// Заполнение недостающих полей в configRow
				if (self.data.length)
					configRow = Object.assign({}, self.data[0], configRow);

				configRow.gandsPropertiesRef.forEach(function(row) {
					if (row.property != "номенклатура-группы")
						return;

					proto._matcherPatterns = proto._matcherPatterns.concat(eval("(" + row.value + ")"));
				});
			}

			// -------------------------------------------------------------------------------------

			self._buildIndexData();

			callback(null, self);
		},


		"_buildIndexData": function() {
			this._indexData = {};

			this.data.forEach(function(row) {
				var match = this._groupMatcher(row);

				match.forEach(function(m) {
					if (typeof this._indexData[m] != "object")
						this._indexData[m] = [];

					this._indexData[m].push(row);
				}, this);
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


		/**
		 * @ignore
		 * */
		"_indexHas": function() {

		},


		/**
		 * @ignore
		 * */
		"_indexBuild": function() {

		},


		"_isDraft": function(row) {
			return Boolean(row.GSName.match(/^[*]/gi) || row.GSKindName.match(/^[*]/gi));
		},


		/**
		 * Получить родительскую запись
		 * @param {Object | String} row
		 * return {Object | undefined}
		 * */
		"getParent": function(row) {
			if (
				_utils.getType(row) == "object"
				&& row.GSID
			) {
				return this.dataReferences.get(row.GSID.slice(0, -2))
			}

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
			if (_utils.getType(row) == "object" && row.GSID)
				row = this.dataReferences.get(row.GSID);

			else if (_utils.getType(row) == "string")
				row = this.dataReferences.get(row);

			else
				throw new Error("1st argument suppose to be String or Object");

			if (!row)
				return [];

			if (fld && typeof fld != "object")
				throw new Error("2nd argument supposed to be type Object");

			opt = opt || {};

			var res = !fld ? row.gandsExtRef : this._fetchRowExtFields(row, fld);

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
		 * @param {Object | String} row - код либо запись номенклатуры
		 * @param {Array | String=} props - массив свойств
		 * @param {Object=} options - параметры выборки
		 * @return {undefined | Array}
		 * */
		"getProperty": function(row, props, options) {
			var ret = [];

			if (_utils.getType(row) == "object" && row.GSID) {
				row = this.dataReferences.get(row.GSID);

			} else if (_utils.getType(row) == "string") {
				row = this.dataReferences.get(row);

			} else {
				throw new Error("1st argument suppose to be String or Object");
			}

			if (!row)
				return ret;

			if (_utils.getType(props) == "array") {

			} else if (typeof props == "string") {
				props = [props];

			} else {
				props = [];
			}

			var c,
				props_ = [],
				row_ = row;

			for (c = 0; c < props.length; c++) {
				if (typeof props[c] != "string")
					continue;

				props_[c] = props[c].toLowerCase();
			}

			do {
				if (!props_.length) {
					ret = ret.concat(row_.gandsPropertiesRef);

				} else {
					for (c = 0; c < row_.gandsPropertiesRef.length; c++) {
						if (props_.indexOf(row_.gandsPropertiesRef[c].property.toLowerCase()) > -1) {
							ret.push(row_.gandsPropertiesRef[c]);
						}
					}

				}
			} while (row_ = this.getParent(row_));

			if (_utils.getType(options) != "object") {
				options = {};
			}

			if (options.onlyPriority) {
				var priorProps = {};

				for (c = 0; c < ret.length; c++) {
					if (
						typeof priorProps[ret[c].property] != "object"
						|| priorProps[ret[c].property].extID.length < ret[c].extID.length
					) {
						priorProps[ret[c].property] = ret[c];
					}
				}

				ret = [];

				for (var prop in priorProps) {
					if (!priorProps.hasOwnProperty(prop)) continue;
					ret.push(priorProps[prop]);
				}
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

			var type = _utils.getType(arg.type) == "array"
				? arg.type
				: [];

			if (_utils.getType(arg.group) == "array")
				type = arg.group;

			var cop = _utils.getType(arg.cop) == "array" ? arg.cop : [],
				flags = _utils.getType(arg.flags) == "array" ? arg.flags : [],
				useDraft = typeof arg.useDraft == "undefined" ? true : Boolean(arg.useDraft);

			if (!type.length && !cop.length) return this.data;

			var c,
				v,
				match,
				tmp = [];

			if (
				type.length == 1
				&& !cop.length
				&& !flags.length
				&& useDraft
			) {
				if (typeof this._indexData[type[0]] != "object") {
					return [];
				}
				return this._indexData[type[0]];
			}

			var flagsRegEx = new RegExp(flags.join("|"));

			for (c = 0; c < this.data.length; c++) {

				if (tmp.indexOf(this.data[c]) > -1) continue;

				if (this._isDraft(this.data[c]) && !useDraft) {
					continue;
				}

				if (flags.length && !this.data[c].GSFlag.match(flagsRegEx)) {
					continue;
				}

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
			return (str.match(/\[gs\][a-zA-Z0-9а-яА-Я;\s]+\[\/gs\]/ig) || []).reduce(function(arr, gsLnk) {
				gsLnk = _utils.rmGsTags(gsLnk).split(/;\s*/ig);

				arr.push.apply(arr, gsLnk);

				return arr;
			}, []);
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