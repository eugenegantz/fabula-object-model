var cConst = require("./CalcConsts");
var cDef = require("./DefaultPrintCalc").prototype.getInstance();

var CPOffset = function(){};

CPOffset.prototype.calc = function(arg){
	if (typeof arg != "object"){
		throw new Error("!arg");
	}

	// var isStrict = typeof arg.strict == "undefined" ? true : Boolean(arg.strict);
	var c, v;
	var cUtils = require("./CalcUtils");
	var pUtils = require("./../PrintUtils");
	var Gm = require("./../GandsDataModel").prototype.getInstance();

	// ------- Количество
	var amount = cUtils.parseAmount(arg.amount);
	if (!amount) throw new Error("!arg.amount");
	amount = Math.abs(+arg.amount);

	// ------- Материал
	var material = cUtils.parseMaterial(arg.material);
	if (  !material  ) return new Error("!arg.material");

	// ------- Цветность
	var colorCode = cUtils.parseColorCode(arg.colorCode);
	if (!colorCode) return new Error("!arg.colorCode");

	// ------- Офсетные пластины
	var printForm = "ТЦМППЛ01";
	if (typeof arg.printForm == "string" && arg.printForm){
		printForm = arg.printForm;
	}

	// ------- Формат
	var format = cUtils.parseFormat(arg.format);
	if (!format) return new Error("!arg.format");

	// ------- Формат запечатки
	var collageFormat =
		typeof arg.collageFormat == "string"
			? pUtils.getFormat(arg.collageFormat)
			: pUtils.getFormat("ТСПоФмА3");

	if (  !collageFormat  ){
		return new Error("!collageFormat");
	}

	// ------------------------------------------------------------
	// Количестов продукции умещаемых на листе запечатки
	var format_k = Math.floor(collageFormat.area / format.area);

	// ------------------------------------------------------------

	var printFormPrice = 0, materPrice = 0, rollsPrice = 0, tmp;

	// ------------------------------------------------------------
	// Количество и стоимость листов;
	var gandsMater = Gm.get({
		"type":["material-paper","materials:print"],
		"cop":[
			new RegExp("^07","gi")
		]
	});

	for(c=0; c<gandsMater.length; c++){

		// Получение цены листопрохода
		if (  gandsMater[c].GSID.match(/ПЗРАЛП/gi)  ){
			for(v=0; v<gandsMater[c].gandsPropertiesRef.length; v++){
				if (  gandsMater[c].gandsPropertiesRef[v].property.match(/Способ печати/gi)  ){
					if (  gandsMater[c].gandsPropertiesRef[v].value.match(/офсет/gi)  ){
						tmp = cDef.calc({
							"salePrice": true,
							"amount": amount,
							"GSID": gandsMater[c].GSID
						});
						rollsPrice = tmp.sum; //.sum gandsMater[c].GSCostSale || gandsMater[c].GSCost;
						break;
					}
				}
			}
		}

	}

	// Получение цены материала
	if (  !Gm.dataReferences.has(material)  ){
		return new Error("!material.found");
	}
	materPrice = Gm.dataReferences.get(material).GSCostSale || Gm.dataReferences.get(material).GSCost;

	// Получение цены печатных пластин
	if (  Gm.dataReferences.has(printForm)  ){
		printFormPrice = Gm.dataReferences.get(printForm).GSCostSale || Gm.dataReferences.get(printForm).GSCost;
	}

	// ------------------------------------------------------------

	var paperAmount = (amount / format_k) + cConst.OFFSET_PREPRINT_PAPER_AMOUNT; // + допечатная подготовка
	var paperSum = paperAmount * materPrice;

	// ------------------------------------------------------------
	// Количество и стоимость пластин
	// var printFormAmount = (colorCode[0] + colorCode[1]) * amount;
	var printFormSum = (colorCode[0] + colorCode[1]) * printFormPrice;

	// ------------------------------------------------------------
	// Количество листопроходов
	var rollsSum = (paperAmount * rollsPrice) * (colorCode[0] > 0 && colorCode[1] > 0 ? 2 : 1);

	// ------------------------------------------------------------
	// Результат

	var sum = paperSum + rollsSum + printFormSum;

	var discount = !isNaN(arg.discount) ? +arg.discount : 0;

	sum = sum - (sum * (discount / 100));

	return Math.round(sum * 1000) / 1000;
};

module.exports = CPOffset;