var printUtils = require("./../PrintUtils");
var cConst = require("./CalcConsts");
var dpc = require("./DefaultPrintCalc").prototype.getInstance();
var cUtils = require("./CalcUtils");

var cLam = function(){};


cLam.prototype.formatFill = function(small){
	return printUtils.formatFill("ТСПоФмА3", small);
};


cLam.prototype.getGSID = function(){
	return [
		cConst.POSTPROC_LAMINATING_1_SIDE_GSID,
		cConst.POSTPROC_LAMINATING_2_SIDE_GSID,
		cConst.POSTPROC_LAMINATING_CUSTOM_GSID
	];
};


cLam.prototype.isOwnGSID = function(GSID){
	return this.getGSID().indexOf(GSID) > -1;
};


/**
 * Рассчитать количестов используемых листов ламината стандартного формата
 * @param {Object} arg
 * @param {String} arg.format - печатный формат ламинируемой продукции
 * @param {Number} arg.amount - тираж продукции
 * */
cLam.prototype.calcAmount = function(arg){
	var full = typeof arg.full == "undefined" ? true : Boolean(arg.full);
	var format = cUtils.parseFormat(arg.format);
	if (!format) return 0;
	var filled = this.formatFill(format);
	if (!filled) return 0;
	var ret = arg.amount / filled;
	return full ? Math.ceil(ret) : ret;
};


/**
 * @param {Object} arg
 * @param {Number} arg.amount - тираж
 * @param {arg.GSID=} arg.GSID - номенклатурный номер
 * @param {Number} arg.side - количество сторон
 * @param {String=} arg.material
 * @param {Number=} arg.discount - % скидки. От 0 до 100
 * @param {Boolean} arg.salePrice - считать цену продажи
 * */
cLam.prototype.calc = function(arg){
	var amount;

	if (typeof arg != "object"){
		throw new Error("!arg");
	}

	if (  !isNaN(arg.amount)  ){
		amount = +arg.amount;
	}

	if (!amount) return 0;

	var material = null;
	if (typeof arg.material == "string"){
		material = arg.material;
	}

	// -----------------------------------------------------------------------------

	var side;
	if (  !isNaN(arg.side)  ) side = parseInt(arg.side) || void 0;

	var GSID;

	if (  side == 1  ){
		GSID = cConst.POSTPROC_LAMINATING_1_SIDE_GSID;

	} else if (  side == 2  ) {
		GSID = cConst.POSTPROC_LAMINATING_2_SIDE_GSID;

	}

	if (typeof arg.GSID == "string" && arg.GSID){
		GSID = arg.GSID;
	}

	if (!GSID){
		throw new Error("!GSID");
	}

	// -----------------------------------------------------------------------------

	var format = cUtils.parseFormat(arg.format);
	if (  !format  ){
		throw new Error("!arg.format");
	}

	var lamAmount = this.calcAmount({
		"amount": amount,
		"format": format
	});

	if (!lamAmount) return 0;

	// -----------------------------------------------------------------------------

	var discount = 0;

	if (  !isNaN(arg.discount)  ){
		discount = +arg.discount;
	}

	// -----------------------------------------------------------------------------

	var salePrice = Boolean(arg.salePrice);

	var sum = dpc.calc({
		"amount": lamAmount,
		"GSID": GSID,
		"salePrice": salePrice
	});

	sum = sum.sum - (sum.sum * discount / 100);

	return Math.round(sum * 100) / 100;
};

module.exports = cLam;