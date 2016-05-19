"use strict";

var DefaultDataModel = require("./DefaultDataModel");
var InterfaceFProperty = require("./InterfaceFProperty");
var TalksDataModel = require("./TalksDataModel");

var _utils = require("./../utils");

// Для совместимости
var getContextDB = function(){
	var FabulaObjectModel = require("./../_FabulaObjectModel.js");
	var DBModel = FabulaObjectModel.prototype._getModule("DBModel");

	if (  this._fabulaInstance ){
		return this._fabulaInstance.getDBInstance();
	}
	return DBModel.prototype.getInstance();
};

// TODO пересмотреть алиасы
/**
 * @constructor
 * @augments DefaultDataModel
 * @implements InterfaceFProperty
**/
var MovDataModel = function(){

	// this.instances.push(this);

	DefaultDataModel.call(this);

	InterfaceFProperty.call(this);

	var self = this;

	this.set({
		"GSDate":		new Date(),	// ALIASES: creatingDate
		"MMID":			null, 				// Integer
		"MMPID":		null,				// Integer
		"Doc":			null,				// string
		"Doc1":			null,				// String
		"IsDraft":		null,				// Integer (as Boolean)
		"GS":				null, 				// string
		"GSSpec":		null,				// string
		"Amount":		null,				// Integer
		"Sum":			null,				// Float, Array(object,object,object), // ALIASES: mov_sum
		"Sum2":			null,				// Float
		"Price":			null,				// Float
		"InOut":			null,				// Integer
		"CodeOp":		null,				// string
		"MMFlag":		"1",				// String
		"Performer":	null,				// Integer
		"Manager2":	null,				// Integer
		"Agent2":		null				// Integer
	});

	this._property = [];

	this.childrenMovs = [];

	this.parentMov = null;

	this.propsChanged = Object.create(null);

	// ------------------------------------------------------------------------

	for(var prop in self.propertyKeys){
		if (  !self.propertyKeys.hasOwnProperty(prop)  ) continue;
		(function(){
			var prop_ = prop;
			self.setAlias(
				"getMethod",
				prop,
				function(arg){
					return self.getFabPropertyAliasMethod(prop_, arg);
				}
			);
			self.setAlias(
				"setMethod",
				prop,
				function(value,arg){
					return self.setFabPropertyAliasMethod(prop_, value, arg);
				}
			)
		})();
	}

	// ------------------------------------------------------------------------

	this.setAlias(
		"setMethod",
		"amount",
		function(value){
			if (isNaN(value)) return false;
			value = parseFloat(value);
			if (value <= 0) value = 1;
			self.props.amount = value;
			self.propsChanged.amount = true;
			return true;
		}
	);

	this.on("set:mmid", this._eventSetMMID);
	this.on("set:doc", this._eventSetDoc);
	this.on("afterset:parentdoc", this._eventSetParentDoc);
	// this.on("set:gs", this._eventSetGS);

	// this.setAlias("set","creatingDate","GSDate");
	// this.setAlias("set","mov_sum","Sum");
	// this.setAlias("set","GSID","GS");

	// this.setAlias("get","creatingDate","GSDate");
	// this.setAlias("get","mov_sum","Sum");
	// this.setAlias("get","GSID","GS");

	this.set("_unique_sid", Math.random() * Math.pow(10,17));

	this.clearChanged();

};

MovDataModel.prototype = DefaultDataModel.prototype._objectsPrototyping(
	DefaultDataModel.prototype,
	InterfaceFProperty.prototype,
	{

		"_eventSetGS": function(){
			/*
			 * Планировалось привязать к событию "set:gs"
			 * Для автоматического присваивания кода операции
			 * (Поле CodeOp в Movement, поле GSCOP в GANDS)
			 * Это требует асинх загрузки GandsDataModel.
			 * Нет гарантии успешной выборки GSCOP из GANDS при отсутствии
			 * задержек между инициализацией экземпляра и присваиванием.
			 * => Было решено переложить данный функционал на внешние контроллеры
			 * */
		},


		"_eventSetMMID": function(){
			var e = arguments[1];
			for(var c=0; c<this.childrenMovs.length; c++){
				this.childrenMovs[c].set("MMPID", e.value);
			}
		},


		"_eventSetDoc": function(){
			var e = arguments[1];
			var c, v, keys, keys_, lowKey;

			var doc = e.value || this.get("Doc1") || this.get("ParentDoc") || null;

			for(c=0; c<this.childrenMovs.length; c++){
				if (  !this.childrenMovs[c].get("parentDoc")  ){
					this.childrenMovs[c].set("Doc", doc);
				}
			}

			for(c=0; c<this._property.length; c++){
				if (!this._property[c]) continue;
				keys = Object.getOwnPropertyNames(this._property[c]);
				keys_ = [];
				for(v=0; v<keys.length; v++){
					lowKey = keys[v].toLowerCase();
					keys_.push(lowKey);
					if (lowKey == "extid"){
						this._property[c][keys[v]] = doc;
					}
				}
				if (keys_.indexOf("extid") == -1) this._property[c].extid = e.value;
			}
		},


		"_eventSetParentDoc": function(){
			// Экспериментальное событие
			// Чтобы в интерфейсе фабулы задачи были видны как подчиненные
			// Необходимо чтобы они имели записи ParentDoc и равный ему Doc1
			var e = arguments[1];
			if (typeof e.value != "string") return;
			this.set("Doc1",e.value);
			this.set("Doc", null);
		},


		"addCMov": function(){
			return this.addChildMov.apply(this, arguments);
		},


		"addChildMov": function(child){
			var mov, c, prop;

			if (  Array.isArray(child)  ){

			} else if (typeof child == "object") {
				child = [child];

			} else {
				return false;

			}

			for(  c=0; c<child.length; c++  ){
				if (typeof child[c] != "object") continue;

				if (  child[c] instanceof  MovDataModel){

					mov = child[c];

				} else {

					mov = new MovDataModel();

					for (prop in child[c]) {
						if (typeof child[c].hasOwnProperty == "function") {
							if (!child[c].hasOwnProperty(prop)) continue;
						}
						if (typeof child[c][prop] == "undefined") continue;
						mov.set(prop, child[c][prop]);
					}

				}

				mov.set("MMPID", this.get("MMID"));

				this.childrenMovs.push(mov);
			}

			return true;
		},


		"appendChildMov": function(){
			return this.addChildMov.apply(this, arguments);
		},


		"deleteChildMov": function(){
			return this.removeChilldMov.apply(this, arguments);
		},


		"deleteCMov": function(){
			return this.removeChilldMov.apply(this, arguments);
		},

		"removeCMov": function(){
			return this.removeChilldMov.apply(this, arguments);
		},

		"removeChilldMov": function(keyValue){

			if (typeof keyValue != "object") return false;

			if (  keyValue instanceof MovDataModel ){

				this.childrenMovs = this.childrenMovs.filter(
					function(mov){
						if (  !mov  ) return false;
						if (  typeof mov != "object"  ) return false;
						return mov.get("_unique_sid") != keyValue.get("_unique_sid");
					}
				);
				return true;

			} else {

				this.childrenMovs = this.childrenMovs.filter(
					function(mov){
						if (  !mov  ) return false;
						if (  typeof mov != "object"  ) return false;
						var keys = Object.getOwnPropertyNames(keyValue);
						for(var c=0; c<keys.length; c++){
							if (  mov.get(keys[c]) != keyValue[keys[c]]  ) return true;
						}
						return false;
					}
				);

			}

			return true;

		},


		/**
		 * @param {Object, MovDataModel=} keyValue - условия поиска по полям или обьект поиска
		 * @param {Object=} propKeyValue - условия поиска по свойствам
		 * @returns Array
		 * */
		"getCMov": function(keyValue, propKeyValue){
			return this.getChildrenMov.apply(this, arguments);
		},


		/**
		 * @param {Object, MovDataModel=} fieldsArg - условия поиска по полям или обьект поиска
		 * @param {Object=} propertyArg - условия поиска по свойствам
		 * @returns Array
		 * */
		"getChildrenMov": function(fieldsArg, propertyArg){

			if (!arguments.length) return this.childrenMovs;

			if (typeof fieldsArg != "object" || !fieldsArg) fieldsArg = {};

			if (typeof propertyArg != "object" || !propertyArg) propertyArg = {};

			var c;

			if (  fieldsArg instanceof MovDataModel ){

				for(c=0; c<this.childrenMovs.length; c++){
					if (  this.childrenMovs[c].get("_unique_sid") == fieldsArg.get("_unique_sid")  ){
						return [this.childrenMovs[c]];
					}
				}

			} else {

				return this.childrenMovs.filter(
					function(mov){
						if (!mov) return false;
						if (typeof mov != "object") return false;

						var c, keys, ret = true;

						keys = Object.getOwnPropertyNames(fieldsArg);
						for(c=0; c<keys.length; c++){
							if (  mov.get(keys[c]) != fieldsArg[keys[c]]  ) ret = false;
						}

						keys = Object.getOwnPropertyNames(propertyArg);
						if (keys.length) {
							if (!mov.getProperty(propertyArg).length) ret = false;
						}
						return ret;
					}
				);

			}

			return [];

		},


		"getJSON": function(){
			var keys = Object.getOwnPropertyNames(this.props);
			var defaultFields = _utils.objectKeysToLowerCase(this.__movDataModelDefaultFields);
			var lowKey, json = {};
			for(var c=0; c<keys.length; c++){
				lowKey = keys[c].toLowerCase();
				if (  !defaultFields.hasOwnProperty(lowKey)  ) continue;
				json[lowKey] = this.props[keys[c]];
			}
			return json;
		},


		"load": function(arg){

			if (typeof arg != "object") arg = Object.create(null);

			var c;

			var callback = typeof arg.callback == "function" ? arg.callback : new Function();

			var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();

			var fields = _utils.parseArg({
				"value": arg.fields ? arg.fields : null,
				"into": "array",
				"kickEmpty": true,
				"toLowerCase": true,
				"delimiters": [";",","]
			});

			if (  !fields || !fields.length  ){
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

			for(c=0; c<fields.length; c++){
				if (  ["sum","sum2","price"].indexOf(fields[c].toLowerCase()) >-1  ){
					fields[c] = "["+fields[c]+"]";
				}
			}

			var self = this;

			// -----------------------------------------------------------------------------------------------

			var MMID = this.get("MMID");

			if (!MMID || isNaN(MMID)) return;

			MMID = parseInt(MMID);

			// -----------------------------------------------------------------------------------------------

			// 38005
			// 37723 - РА5по31846

			var DBq = [
				// Получение записи движения ТиУ
				"SELECT " +
				fields.join(",") +
				" FROM Movement " +
				" WHERE MMID = " + MMID,

				// Получение свойств записи
				" SELECT uid, pid, ExtClass, ExtID, property, value FROM Property WHERE pid = " + MMID + " ",

				// Получение подчиненных записей
				"SELECT " +
				fields.join(",") +
				" FROM Movement " +
				" WHERE MMPID = " + MMID,

				// Получение свойств подчиненных записей
				" SELECT uid, pid, ExtClass, ExtID, property, value " +
				" FROM Property WHERE pid IN (" +
				" SELECT MMID FROM Movement WHERE MMPID = " + MMID + " " +
				" ) "
			];

			dbawws.dbquery({
				"query": DBq.join("; "),
				"callback": function(dbres){
					var c, prop, tmp;

					for(c=0; c<dbres.length; c++){
						if (dbres[c].info.errors) console.error("DBDataModel." + dbres[c].info.errors);
					}

					if (  !dbres[0].recs.length  ){
						callback(["!mov.length"]);
						return;
					}

					// Запись полей ТиУ (Поля задачи)
					var mov = dbres[0].recs[0];

					for(prop in mov){
						if (  !mov.hasOwnProperty(prop)  ) continue;
						self.set(prop, mov[prop]);
					}

					// Запись свойств задачи
					self.addProperty(dbres[1].recs.length ? dbres[1].recs : []);

					// ----------------------------------------------------
					// Формируем подчиненные задачи
					var childrenMovs = dbres[2].recs;
					var childrenMovs_ = {};
					var childMov, row;

					for(c=0; c<childrenMovs.length; c++){
						row = childrenMovs[c];

						childMov = new MovDataModel();
						childMov.set("MMID", row.MMID);
						childMov.parentMov = self;

						for(prop in row){
							if (  !row.hasOwnProperty(prop)  ) continue;
							childMov.set(prop,row[prop])
						}

						childrenMovs_[childMov.get("MMID")] = childMov;
					}

					var childrenProps = dbres[3].recs;

					for(c=0; c<childrenProps.length; c++){
						if (  childrenMovs_.hasOwnProperty(childrenProps[c].pid)  ){
							childrenMovs_[childrenProps[c].pid].addProperty(childrenProps[c]);
						}
					}

					tmp = [];

					for(prop in childrenMovs_){
						if (  typeof childrenMovs_.hasOwnProperty == "function"  ){
							if (  !childrenMovs_.hasOwnProperty(prop)  ) continue;
						}
						tmp.push(childrenMovs_[prop]);
					}

					self.addChildMov(tmp);

					// ----------------------------------------------------
					// Обнуляем информацию о проделанных изм.
					self.clearChanged();
					self.clearChangedProperty();

					callback(null, self);

				} // close.callback
			}); // close.dbquery

		},


		"remove": function(arg){
			if (typeof arg != "object") arg = Object.create(null);

			var callback = typeof arg.callback == "function" ? arg.callback : new Function();

			if (!this.get("MMID")){
				callback("!MMID");
				return;
			}

			var dbawws = getContextDB.call(this);

			dbawws.dbquery({
				"query": "DELETE FROM Movement WHERE MMID='" + this.get("MMID") + "'",
				"callback": function(dbres){
					if (dbres.info.errors.length){
						callback(dbres.info.errors);
						return;
					}
					callback(null);
				}
			});
		},


		"insert": function(A){

			if (typeof A != "object") A = {};

			var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();

			var self = this;

			var callback = typeof A.callback == "function" ? A.callback : new Function();

			var MMID = this.get("MMID");

			var defaultFields = _utils.objectKeysToLowerCase(self.__movDataModelDefaultFields);
			defaultFields.gsdate.value = "NOW()";

			var values = [], fields = [];
			var value, c, prop, tmp, type, lowName;

			// -----------------------------------------------------------------

			self.trigger("beforeInsert");

			// -----------------------------------------------------------------

			for(prop in defaultFields){
				if (  !defaultFields.hasOwnProperty(prop)  ) continue;
				lowName = prop.toLowerCase();

				value = this.get(prop) || defaultFields[prop].value || null;

				if (!value) continue;

				if (  defaultFields[prop].type == "S"  ) {
					values.push(!value ? "NULL" : "\""+_utils.DBSecureStr(value)+"\"");

				} else if (  defaultFields[prop].type == "D"  ) {
					values.push("CDate(\"" + _utils.DBSecureDate(value) + "\")");

				} else {
					values.push(!value ? "NULL" : value);

				}

				fields.push("["+prop+"]");
			}

			var dbq = [
				"INSERT INTO Movement ("+fields.join(",")+") VALUES ("+values.join(",")+")"
			];

			// -----------------------------------------------------------------

			dbq.push("DELETE FROM Property WHERE ExtClass = 'DOCS' AND pid = " + MMID);

			var property;

			var _interfaceFPropertyFields = InterfaceFProperty.prototype._interfaceFPropertyFields;

			for(c=0; c<this._property.length; c++){

				if (  typeof this._property[c] != "object"  ) continue;

				property = _utils.objectKeysToLowerCase(this._property[c]);
				values = [];
				fields = [];

				property.pid = self.get("MMID");

				if (  !property.hasOwnProperty("property")  ) continue;

				if (  !property.hasOwnProperty("value")  ) continue;

				property.extclass = "DOCS";

				property.extid = self.get("Doc");

				for(prop in property){
					if (  !property.hasOwnProperty(prop)  ) continue;

					type = null;
					value = property[prop];
					lowName = prop.toLowerCase();

					if (  value === null || typeof value == "undefined"  ) continue;
					if (
						!_interfaceFPropertyFields.hasOwnProperty(prop)
						|| _interfaceFPropertyFields[prop].spec
					) {
						continue;
					}

					type = _interfaceFPropertyFields[lowName].type;
					type = type.toLowerCase();

					if (type == "string") value = "\""+_utils.DBSecureStr(value)+"\"";

					fields.push("["+prop+"]");
					values.push(value);
				}
				dbq.push(
					"INSERT INTO Property ("+fields.join(",")+") VALUES ("+values.join(",")+")"
				);
			}

			// -----------------------------------------------------------------

			var promises = [
				function(resolve, reject){
					dbawws.dbquery({
						"query": dbq.join("; "),
						"callback": function(dbres){
							var err = [];
							for(var c=0; c<dbres.length; c++){
								if (  dbres[c].info.errors  ){
									err.push(dbres[c].info.errors);
								}
							}
							if (err.length){
								reject(err);
								return;
							}
							resolve();
						}
					});

				}
			];

			for(c=0; c<this.childrenMovs.length; c++){
				(function(){
					var cc = c;
					promises.push(
						function(resolve, reject){
							self.childrenMovs[cc].set("MMPID", self.get("MMID"));
							self.childrenMovs[cc].save({
								"callback": function(err){
									if (err){
										reject(err);
										return;
									}
									resolve();
								}
							})
						}
					);
				})()
			}

			if (
				self.get("MMFlag")
				&& self.get("MMID")
			){

				promises.push(
					function(resolve, reject){

						var docDataObj = self.get("DocDataObject");
						var talksInstance = TalksDataModel.prototype.getInstance();

						talksInstance.postTalk({
							"MMID": self.get("MMID"),
							"MMFlag": self.get("MMFlag"),
							"agent": !docDataObj ? "999" : (docDataObj.get("agent") || 999),
							"callback": function(err){
								if (err){
									reject();
									return;
								}
								resolve();
							}
						});
					}
				);

			}

			if (  !promises.length  ){
				callback(null);
				return;
			}

			Promise.cascade(promises)
				.then(function(){
					callback(null);
					self.trigger("afterInsert");
				})
				.catch(function(err){
					callback(err);
				});

		},


		/**
		 * @param {Boolean}		arg.useNotification			// Включатель уведомление о смене фазы
		 * @param {Boolean}		arg.saveChildren				// Применить изменения в подчиненных задачах
		 * @param {Boolean}		arg.saveParent				// Применить изменения в родительской задаче // НЕ РАБОТАЕТ
		 * @param {Array}			arg.excludeMovs				// Игнорировать изменения в перечисленных задачах. Массив из MMID (целые числа)
		 * @param {Array}			arg.excludeMovs				// Применить изменения только в перечисленных задачах // НЕ РАБОТАЕТ
		 * @param {Function}		arg.callback(err)				// callback
		 * */
		"update": function(arg){
			if (typeof arg != "object") arg = {};

			var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();

			var self = this;

			var callback = typeof arg.callback == "function" ? arg.callback : new Function();

			var useNotification = typeof arg.useNotification == "undefined" ? true : Boolean(arg.useNotification);

			var saveChildren = typeof arg.saveChildren == "undefined" ? true : Boolean(arg.saveChildren);

			// var saveParent = typeof arg.saveParent == "undefined" ? true : Boolean(arg.saveParent);

			var excludeMovs = _utils.parseArg({
					"value":			typeof arg.excludeMovs == "undefined"? null : arg.excludeMovs,
					"into":			"array",
					"isInt":			true,
					"toInt":			true,
					"kickEmpty":	true,
					"delimiters":	[",",";"]
				}) || [];

			var includeMovs = _utils.parseArg({
					"value": typeof arg.includeMovs == "undefined"? null : arg.includeMovs,
					"into":			"array",
					"isInt":			true,
					"toInt":			true,
					"kickEmpty":	true,
					"delimiters":	[",",";"]
				}) || [];

			var MMID = this.get("MMID");

			var dbq = [
				// Получение записи движения ТиУ
				"SELECT MMID FROM Movement WHERE MMID = " + MMID,

				// Получение свойств записи
				" SELECT uid, pid, ExtClass, ExtID, property, [value] FROM Property WHERE pid = " + MMID + " ",

				" SELECT MMID FROM Movement WHERE MMPID = " + MMID
			];


			// ------------------------------------------------------------------------------

			self.trigger("beforeUpdate");

			// ------------------------------------------------------------------------------

			dbawws.dbquery({
				"query": dbq.join("; "),
				"callback": function(dbres) {

					var c, prop, tmp, fields, values, value, type, lowName;
					var dbq = [];

					var changedFields = self.getChanged();
					var disabledFields = ["gsdate","mmid"];

					if (  !dbres[0].recs.length  ){
						callback(["!movs.length"]);
						return;
					}

					var defaultFields = _utils.objectKeysToLowerCase(self.__movDataModelDefaultFields);

					// -----------------------------------------------------------------

					var dbProps = dbres[1].recs;
					// var dbMov = dbres[0].recs[0];
					var dbChildrenMovs = dbres[2].recs;

					// снижение регистра для полей записи из базы
					// dbMov = _utils.objectKeysToLowerCase(dbMov);

					// -----------------------------------------------------------------

					{
						var promises = [];

						var insertedProps = [];
						var deletedProps = [];
						var updatedProps = [];

						var deletedChildren = [];

						var objPropRef = {}; // Ссылки на свойства в обьекте
						var dbPropRef2 = {}; // Ссылки на свойства в БД
						var childrenMovsRef = {};
					}

					// -----------------------------------------------------------------
					// Ссылки на подчиненные задачи
					for(c=0; c<self.childrenMovs.length; c++){
						tmp = self.childrenMovs[c].get("MMID");
						childrenMovsRef[tmp] = self.childrenMovs[c];
					}

					// -----------------------------------------------------------------
					// Список удаленных подчиненных задач
					for(c=0; c<dbChildrenMovs.length; c++){
						if (  !childrenMovsRef.hasOwnProperty(dbChildrenMovs[c].MMID)  ){
							deletedChildren.push(dbChildrenMovs[c].MMID);
						}
					}

					var property;
					tmp = [];

					// ------------------------------------------------------------------
					// Ссылки на свойства задачи
					{
						for(c=0; c<self._property.length; c++){
							if (  typeof self._property[c] != "object" || !self._property[c]  ) continue;

							property = _utils.objectKeysToLowerCase(self._property[c]);

							if (
								!property.hasOwnProperty("property")
								|| !property.hasOwnProperty("value")
							){
								continue;
							}

							self._property[c].pid = self.get("MMID");

							self._property[c].extclass = "DOCS";

							self._property[c].extid = self.get("Doc");

							tmp.push(self._property[c]);

							if (  !property.hasOwnProperty("uid")  ) continue;

							objPropRef[property.uid] = self._property[c];

						}

						self._property = tmp;
					}

					// ------------------------------------------------------------------
					// Создание ссылок на свойства в базе.
					// Создание списка удаленных, добавленных и обновленных свойств
					{
						for(c=0; c<dbProps.length; c++){

							dbPropRef2[dbProps[c].uid] = dbProps[c];

							if (  !objPropRef.hasOwnProperty(dbProps[c].uid)  ){
								deletedProps.push(dbProps[c].uid);
								continue;
							}

							if (  objPropRef[dbProps[c].uid].value != dbProps[c].value  ){
								updatedProps.push(dbProps[c]);
								dbq.push(
									"UPDATE Property " +
									" SET " +
									[
										"[value]=\""+_utils.DBSecureStr(objPropRef[dbProps[c].uid].value)+"\"",
										"[ExtClass]='DOCS'",
										"[ExtID]="+(!self.get("Doc") ? "NULL" : "\""+self.get("Doc")+"\"")
									].join(", ") +
									" WHERE " +
									" property = '"+dbProps[c].property+"' " +
									" AND uid = " + dbProps[c].uid
								);
							}

						}

						var _interfaceFPropertyFields = InterfaceFProperty.prototype._interfaceFPropertyFields;

						for(c=0; c<self._property.length; c++){
							if (  !dbPropRef2.hasOwnProperty(self._property[c].uid)  ){
								insertedProps.push(self._property[c]);

								fields = [];
								values = [];

								for(prop in self._property[c]){
									if (  !self._property[c].hasOwnProperty(prop)  ) continue;

									type = null;
									value = self._property[c][prop];
									lowName = prop.toLowerCase();

									if (  value === null || typeof value == "undefined"  ) continue;
									if (
										!_interfaceFPropertyFields.hasOwnProperty(lowName)
										|| _interfaceFPropertyFields[prop].spec
									){
										continue;
									}

									type = _interfaceFPropertyFields[lowName].type;
									type = type.toLowerCase();

									if (type == "string"){
										value = (  value === null || value === "" ? "NULL" : "\""+_utils.DBSecureStr(value)+"\""  );
									}

									fields.push("["+prop+"]");
									values.push(value);
								}

								if (fields.length != values.length || !fields.length) continue;

								dbq.push( "INSERT INTO Property ("+fields.join(",")+") VALUES ("+values.join(",")+")" );

							}
						}

						// ------------------------------------------------------------------

						if (  deletedProps.length  ){
							dbq.push("DELETE FROM Property WHERE uid IN ("+deletedProps.join(",")+")");
						}

						if (  deletedChildren.length  ){
							dbq.push("DELETE FROM Movement WHERE MMID IN ("+deletedChildren.join(",")+")");
							dbq.push("DELETE FROM Property WHERE pid IN ("+deletedChildren.join(",")+")")
						}
					}


					// -----------------------------------------------------------------
					// Обновление полей в строке
					{
						values = [];

						for(c=0; c<changedFields.length; c++){
							lowName = changedFields[c].toLowerCase();

							if (  !defaultFields.hasOwnProperty(lowName)  ) continue;
							if (  disabledFields.indexOf(lowName) > -1  ) continue;

							value = self.get(lowName);
							type = defaultFields[lowName].type;

							if (  "D" == type  ) {
								values.push(("["+lowName+"]=") + (!value ? "NULL" : 'CDATE(\'' + _utils.DBSecureDate(value)) + '\')');

							} else if (  "S" == type  ) {
								values.push(("["+lowName+"]=") + (!value ? "NULL" : '\'' + _utils.DBSecureStr(value) + '\''));

							} else {
								values.push(("["+lowName+"]=") + (!value ? "NULL" : value));

							}

						}

						if (  values.length  ){
							dbq.push("UPDATE Movement SET "+ values.join(", ") +" WHERE MMID = " + MMID);
						}
					}


					// -----------------------------------------------------------------
					// Если ничего не изменилось

					if (  !dbq.length && !promises.length  ){
						callback(null);
						return;
					}

					// -----------------------------------------------------------------
					// Прим. изменений
					{
						promises.push(
							function(resolve, reject){
								dbawws.dbquery({
									"query": dbq.join("; "),
									"callback": function(dbres){
										var err = [];
										for(var c=0; c<dbres.length; c++){
											if (  dbres[c].info.errors  ){
												err.push(dbres[c].info.errors);
											}
										}
										if (err.length){
											reject(err);
											return;
										}
										resolve();
									}
								});
							}
						);

						if (  saveChildren  ){

							for(c=0; c<self.childrenMovs.length; c++){
								(function(){
									var cc=c;
									// Если в списке исключений, игнорировать любые изменения
									if (  excludeMovs.indexOf(self.childrenMovs[cc].get("MMID")) > -1  ){
										return;
									}
									// Если ничего не менялось, то и выполнять сохранения нет смысла
									if (
										!self.childrenMovs[cc].getChanged().length
										&& !self.childrenMovs[cc].getChangedProperty().length
									){
										return;
									}
									// Если запись уже удалена, update не произойдет. Наоборот insert
									if (  deletedChildren.indexOf(self.childrenMovs[cc].get("MMID")) > -1  ){
										return;
									}
									promises.push(
										function(resolve, reject){
											if (  self.childrenMovs[cc].get("MMPID") != self.get("MMID")  ){
												self.childrenMovs[cc].set("MMPID", self.get("MMID"));
											}
											self.childrenMovs[cc].save({
												"useNotification": false,
												"callback": function(err){
													if (err){
														reject(err);
														return;
													}
													resolve();
												}
											});
										}
									);
								})();
							}

						} // close.save.children

						if (
							useNotification
							&& self.get("MMFlag")
							&& self.get("MMID")
							&& changedFields.indexOf("mmflag") > -1
						){

							promises.push(
								function(resolve, reject){
									var docDataObj = self.get("DocDataObject");

									var talksInstance = TalksDataModel.prototype.getInstance();

									talksInstance.postTalk({
										"MMID": self.get("MMID"),
										"MMFlag": self.get("MMFlag"),
										"agent": !docDataObj ? "999" : (docDataObj.get("agent") || 999),
										"callback": function(err){
											if (err){
												reject();
												return;
											}
											resolve();
										}
									});
								}
							);

						}

					} // close.блок.прим.изм


					// -----------------------------------------------------------------

					if (  !promises.length  ){
						callback(null);
						self.trigger("afterUpdate");
						return;
					}

					Promise.cascade(promises)
						.then(function(){
							callback(null);
							self.trigger("afterUpdate");
						})
						.catch(function(err){
							callback(err);
						});

				}
			});

		},


		"__movDataModelDefaultFields": {
			"MMID":			{"type": "N"},
			"MMPID":		{"type": "N"},
			"IsDraft":		{"type": "N"},
			"Tick":			{"type": "N"},
			"Doc":			{"type": "S"},
			"Doc1":			{"type": "S"},
			"ParentDoc":	{"type": "S"},
			"MMFlag":		{"type": "S"},
			"InOut":			{"type": "N"},
			"GSDate":		{"type": "D"},
			"GSDate2":		{"type": "D"},
			"Mark":			{"type": "B"},
			"CodeOp":		{"type": "S"},
			"CodeDc":		{"type": "S"},
			"ExtCode":		{"type": "S"},
			"Storage":		{"type": "S"},
			"GS":				{"type": "S"},
			"GSSpec":		{"type": "S"},
			"GSExt":			{"type": "N"},
			"Consigment":{"type": "N"},
			"Amount":		{"type": "N"},
			"Rest":			{"type": "N"},
			"RestSum":		{"type": "N"},
			"Price":			{"type": "N"},
			"PrimeCost":	{"type": "N"},
			"Sum":			{"type": "N"},
			"Sum2":			{"type": "N"},
			"FirmProduct":{"type": "N"},
			"Remark":		{"type": "S"},
			"NameAVR":	{"type": "S"},
			"Agent2":		{"type": "N"},
			"Manager2":	{"type": "N"},
			"Performer":	{"type": "N"}
		},


		"save": function(A){
			var self = this;

			if (typeof A != "object") A = Object.create(null);

			// Ответ
			// var callback = (typeof A.callback == "function" ? A.callback : function(){});

			// Подключение к БД
			var dbawws = getContextDB.call(this); // DBModel.prototype.getInstance();

			var DBq = [
				"SELECT MMID, GSDate FROM Movement WHERE MMID = " + ( isNaN(this.get("MMID")) ? '-1' : this.get("MMID") ) ,
				"SELECT MAX(MMID)+1 as NEW_MMID FROM Movement"
				// "SELECT ExtClass FROM Ps_property WHERE ExtClass IS NOT NULL AND pid = " + this.get("MMID")
			];

			/**
			 * Проверка: есть ли записи с указанным MMID, если уже есть, выполнить обновление
			 * При отсутствии выполняется новая запись.
			 */
			dbawws.dbquery({
				"query" : DBq.join(";"),
				"callback" : function(dbres){

					if (!dbres[0].recs.length){
						// Новая запись
						console.log("INSERT");

						self.set("MMID",dbres[1].recs[0].NEW_MMID);

						self.insert(A);

					} else {
						// Обновление
						console.log("UPDATE");
						self.update(A);

					} // close.if.update

				} // close.callback

			}); // close.dbquery
		}


	}
);

module.exports = MovDataModel;