var cUtils = require("./CalcUtils");
// var pUtils = require("./../PrintUtils");
var cConsts = require("./CalcConsts");
var GandsDataModel = require("./../GandsDataModel");
var Gm = GandsDataModel.prototype.getInstance();
var cComp = require("./CalcComposite");

var CalcBr = function(){

};

CalcBr.prototype.calc = function(arg){

	if (typeof arg != "object"){
		throw new Error("!arg");
	}

	arg = JSON.parse(JSON.stringify(arg));

	// ------- Количество
	arg.amount = cUtils.parseAmount(arg.amount);
	if (!arg.amount) throw new Error("!arg.amount");

	arg.inner.amount = cUtils.parseAmount(arg.inner.amount);
	if (!arg.inner.amount) throw new Error("!arg.inner.amount");
	arg.inner.amount = arg.inner.amount * arg.amount;

	arg.cover.amount = cUtils.parseAmount(arg.cover.amount);
	if (!arg.cover.amount) arg.cover.amount = 1;
	arg.cover.amount = arg.cover.amount * arg.amount;

	// ------- Материал
	arg.inner.material = cUtils.parseMaterial(arg.inner.material);
	if (  !arg.inner.material  ) return new Error("!arg.inner.material");

	arg.cover.material = cUtils.parseMaterial(arg.cover.material);
	if (  !arg.cover.material  ) return new Error("!arg.cover.material");

	// ------- Цветность
	arg.inner.colorCode = cUtils.parseColorCode(arg.inner.colorCode);
	if (!arg.inner.colorCode) return new Error("!arg.inner.colorCode");

	arg.cover.colorCode = cUtils.parseColorCode(arg.cover.colorCode);
	if (!arg.cover.colorCode) return new Error("!arg.cover.colorCode");

	// ------- Формат
	arg.format = cUtils.parseFormat(arg.format);
	if (!arg.format) return new Error("!arg.format");
	arg.inner.format = arg.format;
	arg.cover.format = arg.format;

	// ------- Послепечатная обработка
	arg.inner._postproc = cUtils.parsePostproc(arg.inner.postproc);
	arg.cover._postproc = cUtils.parsePostproc(arg.cover.postproc);

	// -------------------------------------------------------------------------------------

	arg.inner.method =
		arg.inner.paperAmount <= cConsts.DIGITAL_PRINT_MAX_AMOUNT
		? cConsts.DIGITAL_PRINT
		: cConsts.OFFSET_PRINT;

	arg.cover.method =
		arg.cover.colorCode == "1+1" || arg.cover.colorCode == "1+0"
		? cConsts.RISOGRAPH_PRINT
		: (
			arg.cover.paperAmount <= cConsts.DIGITAL_PRINT_MAX_AMOUNT
				? cConsts.DIGITAL_PRINT
				: cConsts.OFFSET_PRINT
		);

	// -------------------------------------------------------------------------------------

	var comp = new cComp([
		new cComp(
			cUtils.createCalc(arg.inner.method),
			arg.inner
		),
		new cComp(
			cUtils.createCalc(arg.cover.method),
			arg.cover
		)
	]);

	var c;

	for(c=0; c<arg.inner._postproc.length; c++){
		arg.inner._postproc[c].arg.amount = arg.inner.amount;
		arg.inner._postproc[c].arg.salePrice = 1;
		comp.addComponent(
			new cComp(
				arg.inner._postproc[c].m,
				arg.inner._postproc[c].arg
			)
		);
	}

	for(c=0; c<arg.cover._postproc.length; c++){
		arg.cover._postproc[c].arg.amount = arg.cover.amount;
		arg.cover._postproc[c].arg.salePrice = 1;
		comp.addComponent(
			new cComp(
				arg.cover._postproc[c].m,
				arg.cover._postproc[c].arg
			)
		);
	}

	var sum = comp.calc();

	var discount = !arg.discount ? 0 : +arg.discount;

	sum = sum - (sum * discount / 100);

	sum = Math.round(sum * 100) / 100;

	return sum;

};

module.exports = CalcBr;

