var InterfaceEvents = require("./InterfaceEvents");
var DefaultDataModel = require("./DefaultDataModel");
var ObjectA = require("./ObjectA");

var propUtils = {
	"duplicateProperty": function(property){
		var keys = Object.getOwnPropertyNames(property);
		var duplicate = {};
		for(var c=0; c<keys.length; c++){
			duplicate[keys[c]] = property[keys[c]];
		}
	},

	"toLowerCaseKeys": function(property){
		var keys = Object.getOwnPropertyNames(property);
		var lowerProperty = {};
		for(var c=0; c<keys.length; c++){
			lowerProperty[keys[c].toLowerCase()] = property[keys[c]];
		}
		return lowerProperty;
	},

	// Запускается через изм. контекст call, apply
	"setChanged": function(property){
		var propName;

		if (  typeof property == "string"  ) {
			propName = property;

		} else if (  typeof property == "object"  ){
			property = propUtils.toLowerCaseKeys(property);

			if (  typeof property.property == "string"  ){
				propName = property.property;

			} else {
				return;
			}

		} else {
			return;
		}

		propName = propName.toLowerCase();

		if (  this._changedFProperty.indexOf(propName) == -1  ){
			this._changedFProperty.push(propName);
		}
	}
};

var InterfaceFProperty = function(){
	this._property = [];
	this._changedFProperty = [];

	InterfaceEvents.call(this);
};

InterfaceFProperty.prototype = DefaultDataModel.prototype._objectsPrototyping(
	InterfaceEvents.prototype,
	{

		"_interfaceFPropertyFields": {
			"uid"			:{"type":"integer"},
			"pid"			:{"type":"integer"},
			"sort"			:{"type":"integer"},
			"value"		:{"type":"string"},
			"valuetype":{"type":"string"},
			"extclass"	:{"type":"string"},
			"extid"		:{"type":"string"},
			"property"	:{"type":"string"},
			"tick"			:{"type":"integer"}
		},


		"splitProperty": function(property){
			if (  typeof property != "object"  ) return null;

			/*
			var dFn = function(str, d){
				str = str+"";
				var
					tmp = [],
					str_ = "",
					b = Math.floor(str.length / d);
				for(var c=0; c<str.length; c++){
					str_ += str[c];
					if (str_.length >= b || c == str.length - 1){
						tmp.push(str_);
						str_ = "";
					}
				}
				return tmp;
			};
			*/

			var dFn = function(str, L){
				str = str+"";
				var
					tmp = [],
					str_ = "";
				for(var c=0; c<str.length; c++){
					str_ += str[c];
					if (str_.length >= L || c == str.length - 1){
						tmp.push(str_);
						str_ = "";
					}
				}
				return tmp;
			};

			var c, value, tmp;
			var limit = 120;

			var lowProperty = propUtils.toLowerCaseKeys(property);

			if (  !lowProperty.hasOwnProperty("value")  ) {
				lowProperty.value = "";
				value = "";
			} else {
				value = lowProperty.value;
			}

			var words = [];
			var props = [];
			var count = 0;
			var dProperty;

			value = value.split(" ");

			tmp = [];

			for(c=0; c<value.length; c++){
				if (  value[c].length > limit  ){
					tmp = tmp.concat(dFn(value[c], limit));
					continue;
				}
				tmp.push(value[c]);
			}

			value = tmp;

			for(c=0; c<value.length; c++){
				words.push(value[c]);
				count+=value[c].length;
				if (
					count + (value.hasOwnProperty(c+1) ? value[c+1].length : 0) > limit
					|| c == value.length - 1
				){
					dProperty = propUtils.toLowerCaseKeys(lowProperty);
					dProperty.value = words.join(" ");
					props.push(dProperty);
					words = [];
					count = 0;
				}
				count+=value[c].length;
			}

			return props;
		},


		"addProperty": function(property){

			var existsFields = [], prop, type, value, lowName;

			var tmp = {};

			this.trigger("addProperty");

			if (!property || typeof property != "object") return false;

			if (  Array.isArray(property)  ){
				for(var c=0; c<property.length; c++){
					this.addProperty(property[c]);
				}
				return true;
			}

			for(prop in property){
				if (typeof property.hasOwnProperty == "function"){
					if (  !property.hasOwnProperty(prop)  ) continue;
				}
				if (typeof property[prop] == "undefined") continue;

				lowName = prop.toLowerCase();
				existsFields.push(lowName);

				if (  !this._interfaceFPropertyFields.hasOwnProperty(lowName)  ) continue;

				type = this._interfaceFPropertyFields[lowName].type;
				value = property[prop];

				if (type == "integer" && typeof value == "string"){
					if (  value.match(/\D/g)  ) continue;
					if ((value+"").trim() === "") continue;
				}

				tmp[lowName] = value;
			}

			for(prop in this._interfaceFPropertyFields){
				if (!this._interfaceFPropertyFields.hasOwnProperty(prop)) continue;
				lowName = prop.toLowerCase();
				if (  !tmp.hasOwnProperty(lowName)  ) tmp[lowName] = null;
			}

			property = tmp;

			if (  !property.hasOwnProperty("valuetype") || !property.valuetype  ){
				if (  isNaN(property.value)  ){
					property.valuetype = "C";
				} else {
					property.valuetype = "N";
				}
			}

			// Изменен
			propUtils.setChanged.call(this, property);

			this._property.push(property);
		},


		"appendProperty": function(){
			this.addProperty.apply(this, arguments);
		},


		"updateProperty": function(getKeyValue, setKeyValue){
			if (typeof getKeyValue != "object" || !getKeyValue) return;
			if (typeof setKeyValue != "object" || !setKeyValue) return;
			var setKeyValue_ = {};
			var c, v, keys, lowKey;

			keys = Object.getOwnPropertyNames(setKeyValue);
			for(c=0; c<keys.length; c++){
				lowKey = keys[c].toLowerCase();
				setKeyValue_[lowKey] = setKeyValue[keys[c]];
			}

			var props = this.getProperty(getKeyValue);
			var isUpdated = false;

			for(c=0; c<props.length; c++){
				keys = Object.getOwnPropertyNames(props[c]);
				for(v=0; v<keys.length; v++){
					lowKey = keys[v].toLowerCase();
					if (  !setKeyValue_.hasOwnProperty(lowKey)  ) continue;
					isUpdated = true;
					props[c][keys[v]] = setKeyValue_[lowKey];
				}
				// Изменен
				propUtils.setChanged.call(this, props[c]);
			}

			return isUpdated;
		},


		"upsertProperty": function(getKeyValue, insProperty){
			var filterProps = function(pr){
				var tmp = [];
				for(var c=0; c<pr.length; c++){
					if (typeof pr[c] != "object" || !pr[c]) continue;
					tmp.push(pr[c]);
				}
				return tmp;
			};

			var ownProperty, keys, c, v, lowKey, insProperty_;

			if (  arguments.length < 2  ) return false;

			// ------------------------------------------------------------------------------------

			if (  !Array.isArray(insProperty) && typeof insProperty == "object"  ){
				insProperty = [insProperty];

			} else if (  Array.isArray(insProperty)  ) {

			} else {
				return false;

			}

			// ------------------------------------------------------------------------------------

			ownProperty = this.getProperty(getKeyValue);

			insProperty = filterProps(insProperty);

			for(  c=0; ; c++  ){

				// Условие выхода из цикла
				if (
					typeof insProperty[c] == "undefined"
					&& typeof ownProperty[c] == "undefined"
				){
					break;
				}

				if (
					typeof insProperty[c] == "object"
					&& typeof ownProperty[c] == "object"
				){

					insProperty_ = propUtils.toLowerCaseKeys(insProperty[c]);

					keys = Object.getOwnPropertyNames(ownProperty[c]);

					for(v=0; v<keys.length; v++){
						lowKey= keys[v].toLocaleLowerCase();
						if (  !insProperty_.hasOwnProperty(lowKey)  ) continue;
						ownProperty[c][keys[v]] = insProperty_[lowKey];
					}

					// Изменен
					propUtils.setChanged.call(this, ownProperty[c]);

				} else if (  typeof insProperty[c] == "object"  ) {

					this.addProperty(insProperty[c]);

				}

			}

			return true;

		},


		/**
		 * @return {Array}
		 * @param {Object} keyValue
		 * */
		"getProperty": function(keyValue){
			var props = [];

			var caseSens = false;

			var skip, value1, value2, c, v, key, keys;

			this.trigger("getProperty");

			if (
				!arguments.length
				|| !keyValue
				|| !Object.getOwnPropertyNames(keyValue).length
			){
				return this._property;
			}

			if (typeof keyValue != "object") {
				throw new Error("1st argument suppose to be type \"Object\"");
			}

			for(c=0; c<this._property.length; c++){
				skip = 0;

				if (
					typeof this._property[c] != "object"
					|| !this._property[c]
				){
					continue;
				}

				var propObjA = new ObjectA(this._property[c]);

				keys = Object.getOwnPropertyNames(keyValue);

				for(v=0; v<keys.length; v++){
					key = keys[v].toLowerCase();

					if (  !propObjA.has(key)  ) skip = 1;

					value1 = propObjA.get(key);
					value2 = keyValue[keys[v]];

					if (!caseSens){
						value1 = typeof value1 == "string" ? value1.toLowerCase() : value1;
						value2 = typeof value2 == "string" ? value2.toLowerCase() : value2;
					}

					if (  value1 != value2  ) skip = 1;
				}

				if (skip) continue;

				props.push(this._property[c]);

			}

			return props;
		},


		"getChangedProperty": function(){
			return this._changedFProperty;
		},


		"clearChangedProperty": function(){
			this._changedFProperty = [];
		},


		"removeProperty": function(keyValue){
			var props = [];

			if (typeof keyValue != "object") return false;

			var skip, existsFields, prop, value1, value2;

			var caseSens = false;

			this.trigger("removeProperty");

			if (
				!arguments.length
				|| !keyValue
				|| !Object.getOwnPropertyNames(keyValue).length
			){
				this._property = [];
				return true;
			}

			for(var c=0; c<this._property.length; c++){
				skip = 1;

				existsFields = {};

				for(prop in this._property[c]){
					if (  typeof this._property[c].hasOwnProperty == "function"  ){
						if (  !this._property[c].hasOwnProperty(prop)  ) continue;
					}
					if (typeof this._property[c][prop] == "undefined") continue;
					existsFields[prop.toLowerCase()] = this._property[c][prop];
				}

				for(prop in keyValue){
					if (  typeof keyValue.hasOwnProperty == "function"  ){
						if (  !keyValue.hasOwnProperty(prop)  ) continue;
					}
					if (typeof keyValue[prop] == "undefined") continue;

					if (  !existsFields.hasOwnProperty(prop.toLowerCase())  ) continue;

					value1 = existsFields[prop.toLowerCase()];
					value2 = keyValue[prop];

					if (!caseSens){
						value1 = typeof value1 == "string" ? value1.toLowerCase() : value1;
						value2 = typeof value2 == "string" ? value2.toLowerCase() : value2;
					}

					if (  value1 != value2  ) skip = 0;
				}

				// Изменен
				propUtils.setChanged.call(this, this._property[c]);

				if (skip) continue;

				props.push(this._property[c]);

			}

			var isDeleted = this._property.length != props.length;

			this._property = props;

			return isDeleted;
		},

		"deleteProperty": function(){
			return this.removeProperty.apply(this, arguments);
		}

	}
);

module.exports = InterfaceFProperty;