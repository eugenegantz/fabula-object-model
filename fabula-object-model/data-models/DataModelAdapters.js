var _utils = require("./../utils");
var MovDataModel = require("./MovDataModel");
var DocDataModel = require ("./DocDataModel");
var GandsDataModel = require("./GandsDataModel");

var gandsInstance = GandsDataModel.prototype.getInstance();

/**
 * Это настолько Адаптеры что, кто-то назовет их Декораторы
 * От декораторов:
 * - расширяют фунционал объектов наследующих методы интерфейса "InterfaceFProperty"
 *   - возможность выбирать, удалять, обновлять свойства собственных, родительской и подчиненных задач.
 *
 * От адаптеров:
 * - удобный интерфейс для работы с рядом свойств обьектов
 *     - Свойство заявки "Примечание"
 *         - adapter.getNote()
 *         - adapter.setNote({string} note)
 *
 *     - Свойство задачи "Комментарий"
 *         - adapter.getComment();
 *         - adapter.setComment({String} comment)
 *
 *  - Получение валовой суммы по задачам в заявке // adapter.getGrossSum()
 */
var Adapters = Object.create(null);

// -----------------------------------------------------------------------------

Adapters._getProperty = function(ownKeyValue, parentKeyValue, childrenKeyValue){
	var props = [], obj;

	for(var c=0; c<arguments.length; c++){
		if (typeof arguments[c] != "object" || !arguments[c]) continue;

		if (!c){
			obj = this._getSelfObj();

		} else if (c==1) {
			obj = this._getParentObj();

		} else if (c==2) {
			obj = this._getChildrenObj();

		} else {
			continue;
		}

		if (!obj) continue;

		if (!Array.isArray(obj)) obj = [obj];

		for(var v=0; v<obj.length; v++){
			props = props.concat(obj[v].getProperty(arguments[c]));
		}

		if (c==2) break;
	}

	return props;
};

Adapters._updateProperty = function(
	ownGetKeyValue,
	ownSetKeyValue,
	parentGetKeyValue,
	parentSetKeyValue,
	childrenGetKeyValue,
	childrenSetKeyValue
){
	var obj, isUpdated = 0;

	for(var c=0; c<arguments.length; c++){
		if (typeof arguments[c] != "object" || !arguments[c]) continue;

		if (!c){
			obj = this._getSelfObj();

		} else if (c==2) {
			obj = this._getParentObj();

		} else if (c==4) {
			obj = this._getChildrenObj();

		} else {
			continue;
		}

		if (!obj) continue;

		if (!Array.isArray(obj)) obj = [obj];

		for(var v=0; v<obj.length; v++){
			isUpdated += obj[v].updateProperty(arguments[c], arguments[c+1]);
		}

		if (c==5) break;
	}

	return isUpdated > 0;

};

Adapters._upsertProperty = function(
	ownGetKeyValue,
	ownSetKeyValue,
	parentGetKeyValue,
	parentSetKeyValue,
	childrenGetKeyValue,
	childrenSetKeyValue
){
	var obj, insProperty, isUpdated = 0;

	for(var c=0; c<arguments.length; c++){
		if (typeof arguments[c] != "object" || !arguments[c]) continue;

		if (!c){
			obj = this._getSelfObj();

		} else if (c==2) {
			obj = this._getParentObj();

		} else if (c==4) {
			obj = this._getChildrenObj();

		} else {
			continue;
		}

		if (!obj) continue;

		if (!Array.isArray(obj)) obj = [obj];

		for(var v=0; v<obj.length; v++){

			insProperty = _utils.objectKeysToLowerCase(arguments[c+1]);

			if (
				!insProperty.hasOwnProperty("pid")
				|| typeof insProperty.pid == "undefined"
				|| insProperty.pid === null
				|| insProperty.pid === ""
			){
				if (  obj[v] instanceof MovDataModel  ){
					insProperty.pid = obj[v].get("MMID");

				} else if (  obj[v] instanceof DocDataModel  ) {
					insProperty.pid = 0;

				}
			}

			isUpdated += obj[v].upsertProperty(arguments[c], insProperty);
		}

		if (c==5) break;
	}

	return isUpdated > 0;

};

Adapters._deleteProperty = function(ownKeyValue, parentKeyValue, childrenKeyValue){
	var obj, isDeleted = 0;

	for(var c=0; c<arguments.length; c++){
		if (typeof arguments[c] != "object" || !arguments[c]) continue;

		if (!c){
			obj = this._getSelfObj();

		} else if (c==1) {
			obj = this._getParentObj();

		} else if (c==2) {
			obj = this._getChildrenObj();

		} else {
			continue;
		}

		if (!obj) continue;

		if (!Array.isArray(obj)) obj = [obj];

		for(var v=0; v<obj.length; v++){
			isDeleted += obj[v].deleteProperty(arguments[c]);
		}

		if (c==2) break;
	}

	return isDeleted > 0;
};

Adapters._addProperty = function(ownProperty, parentProperty, childrenProperty){
	var obj, c, v, insProperty;

	for(c=0; c<arguments.length; c++){
		if (typeof arguments[c] != "object" || !arguments[c]) continue;

		if (!c){
			obj = this._getSelfObj();

		} else if (c==1) {
			obj = this._getParentObj();

		} else if (c==2) {
			obj = this._getChildrenObj();

		} else {
			continue;
		}

		if (!obj) continue;

		if (!Array.isArray(obj)) obj = [obj];

		for(v=0; v<obj.length; v++){

			insProperty = _utils.objectKeysToLowerCase(arguments[c]);

			if (
				!insProperty.hasOwnProperty("pid")
				|| typeof insProperty.pid == "undefined"
				|| insProperty.pid === null
				|| insProperty.pid === ""
			){
				if (  obj[v] instanceof MovDataModel  ){
					insProperty.pid = obj[v].get("MMID");

				} else if (  obj[v] instanceof DocDataModel  ) {
					insProperty.pid = 0;

				}
			}

			obj[v].addProperty(insProperty);

		}

		if (c==2) break;
	}

};

/**
 * @return {Array}
 * // @param {Object} ownKeyValue
 * // @param {Object} parentKeyValue
 * // @param {Object} childrenKeyValue
 * */
Adapters._getPropertyValue = function(){
	var tmp = this.getProperty.apply(this, arguments);
	for(var c=0; c<tmp.length; c++){
		tmp[c] = tmp[c].value;
	}
	return tmp;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

Adapters.MovTaskAdapter = function(mov){
	if (!arguments.length){
		throw new Error("arguments.length == 0");
	}

	if (mov instanceof MovDataModel == false){
		throw new Error("1st argument suppose to be \"MovDataModel\"");
	}

	this.mov = mov;

};

Adapters.MovTaskAdapter.prototype = {

	"getProperty": Adapters._getProperty,

	"updateProperty": Adapters._updateProperty,

	"upsertProperty": Adapters._upsertProperty,

	"getPropertyValue": Adapters._getPropertyValue,

	"addProperty": Adapters._addProperty,

	"deleteProperty": Adapters._deleteProperty,

	"_getSelfObj": function(){
		return this.mov;
	},

	"_getParentObj": function(){
		return this.mov.parentMov;
	},

	"_getChildrenObj": function(){
		return this.mov.childrenMovs;
	},

	"getCuttingTemplates": function(){
		var props = [], c;
		var gandsPostprocCutting = gandsInstance.get({"type":["postproc:cutting"]});
		for(c=0; c<gandsPostprocCutting.length; c++){
			gandsPostprocCutting[c] = gandsPostprocCutting[c].GSID.toLowerCase();
		}
		var children = this.mov.childrenMovs;
		for(c=0; c<children.length; c++){
			if (!children[c]) continue;
			if (typeof children[c] != "object") continue;
			if (  gandsPostprocCutting.indexOf(children[c].get("GS").toLowerCase()) == -1  ) continue;
			props = props.concat(children[c].getProperty({"Property": "Макет исходящий"}));
			break;
		}
		return props;
	},

	"setCuttingTemplates": function(templates){
		var c, template_, templates_ = [];

		if (typeof templates == "string"){
			templates = [templates];
		}

		if (   Array.isArray(templates)  ){
			for(c=0; c<templates.length; c++){
				if (  typeof templates[c] == "string"  ){
					templates_.push({
						"value": templates[c],
						"property":"Макет исходящий"
					});

				} else if (  typeof templates[c] == "object"  ) {
					template_ = _utils.objectKeysToLowerCase(templates[c]);
					if (  !template_.hasOwnProperty("value") || !template_.value  ) continue;
					template_.property = "Макет исходящий";
					templates_.push(template_);

				}
			}

		} else {
			throw new Error("argument suppose to be String or Array type");
		}

		// .......................................................

		var gandsPostprocCutting = gandsInstance.get({"type":["postproc:cutting"]});
		for(c=0; c<gandsPostprocCutting.length; c++){
			gandsPostprocCutting[c] = gandsPostprocCutting[c].GSID.toLowerCase();
		}

		// .......................................................

		var children = this.mov.childrenMovs;

		var isChanged = false;

		for(c=0; c<children.length; c++){
			if (!children[c]) continue;
			if (typeof children[c] != "object" || !children[c]) continue;
			if (  gandsPostprocCutting.indexOf(children[c].get("GS").toLowerCase()) == -1  ) continue;
			children[c].deleteProperty({"Property":"Макет исходящий"});
			children[c].addProperty(templates_);
			isChanged = true;
			break;
		}
		return isChanged;
	},

	"getComments": function(){
		return this.getPropertyValue({"Property":"Комментарий"});
	},

	"setComment": function(comment){
		if (typeof comment != "string"){
			throw new Error("type != \"String\"");
		}

		this.mov.removeProperty({"Property": "Комментарий"});

		comment = comment.replace(/[\n\v\r]/gi,"").trim();

		if (  comment  ){
			this.mov.addProperty(
				this.mov.splitProperty({"Property":"Комментарий","value":comment})
			);
		}
	},

	"setPostproc": function(postproc){

		var mov = this._getSelfObj();
		var child, c, v, tmp;
		var postproc_ = [];

		for(c=0; c<postproc.length; c++){
			if (typeof postproc[c] != "object" || !postproc[c]) continue;

			child = mov.getCMov({"mmid":postproc[c].mmid});

			if (!child.length || !postproc[c].mmid){
				child = new MovDataModel();
				mov.addChildMov(child);
			} else {
				child = child[0];
			}

			child.set(postproc[c]);

			postproc_.push(child.get("MMID"));

		}

		var movs = mov.getCMov();

		for(c=0; c<movs.length; c++){
			if (  !movs[c].get("MMID")  ) continue;
			if (  postproc_.indexOf(movs[c].get("MMID")) == -1  ){
				mov.removeCMov(movs[c]);
			}
		}

	},

	"getPostprocMov": function(){
		// COP07 - КОП "работы"
		var gandsPostproc = gandsInstance.get({
			"cop": [
				new RegExp("07","gi")
			]
		});

		var c, tmp, postproc = [], gandsPostproc_ = [];
		for(c=0; c<gandsPostproc.length; c++){
			gandsPostproc_[c] = gandsPostproc[c].GSID.toLowerCase();
		}
		var movs = this.mov.childrenMovs;
		for(c=0; c<movs.length; c++){
			tmp = movs[c].get("GS");
			if (typeof tmp != "string") continue;
			tmp = tmp.toLowerCase();
			if (  gandsPostproc_.indexOf(tmp) == -1  ) continue;
			postproc.push(movs[c]);
		}
		return postproc;
	},

	"getPostprocObject": function(){
		var pp = this.getPostprocMov();
		for(var c=0; c<pp.length; c++){
			pp[c] = pp[c].getJSON();
		}
		return pp;
	}
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

Adapters.DocAdapter = function(doc){
	if (!arguments.length){
		throw new Error("!arguments.length");
	}
	if (  doc instanceof DocDataModel == false ){
		throw new Error("1st argument suppose to be \"DocDataModel\"");
	}
	this.doc = doc;
};

Adapters.DocAdapter.prototype = {

	"getPropertyValue": Adapters._getPropertyValue,

	"_getSelfObj": function(){
		return this.doc;
	},

	"_getParentObj": function(){
		return null;
	},

	"_getChildrenObj": function(){
		return null;
	},

	"getProperty": Adapters._getProperty,

	"addProperty": Adapters._addProperty,

	"deleteProperty": Adapters._deleteProperty,

	"getGrossSum": function(){
		var movs = this.doc.getMov();
		var sum = 0;
		for(var c=0; c<movs.length; c++){
			if (  movs[c].get("ParentDoc")  ) continue;
			sum += movs[c].get("Sum");
		}
		return sum;
	},

	"getNote": function(){
		return this.getPropertyValue({"Property":"Примечание"});
	},

	"setNote": function(note){
		if (typeof note != "string"){
			throw new Error("type != \"String\"");
		}

		note = note.replace(/[\n\v\r]/gi,"").trim();

		this.doc.removeProperty({"Property": "Примечание"});

		if (note){
			this.doc.addProperty(
				this.doc.splitProperty({"Property":"Примечание","value":note})
			);
		}
	}
};

module.exports = Adapters;