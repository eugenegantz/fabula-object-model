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
	var pUtils = require("../../utils/print");
	var gm = require("./../GandsDataModel").prototype.getInstance();

	// Настройки из Fabula
	var configRow = gm.get({"group": ["fom-config"]})[0];

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
	var printForm = gm.getProperty(configRow, "код-кальк-пластина-по-умолчанию");
	if (!printForm.length){
		printForm = "ТЦМППЛ01";
	} else {
		printForm = printForm[0].value;
	}
	if (typeof arg.printForm == "string" && arg.printForm){
		printForm = arg.printForm;
	}

	// ------- Формат
	var format = cUtils.parseFormat(arg.format);
	if (!format) return new Error("!arg.format");

	// ------- Формат запечатки
	var collageFormat = gm.getProperty(configRow, "код-кальк-формат-запечатки-по-умолчанию-офсет");
	if (!collageFormat.length){
		collageFormat = "ТСПоФмА3";
	} else {
		collageFormat = collageFormat[0].value;
	}
	collageFormat =
		typeof arg.collageFormat == "string"
			? pUtils.getFormat(arg.collageFormat)
			: pUtils.getFormat(collageFormat);

	if (  !collageFormat  ){
		return new Error("!collageFormat");
	}

	// ------------------------------------------------------------
	// Количестов продукции умещаемых на листе запечатки
	var format_k = Math.floor(collageFormat.area / format.area);

	// ------------------------------------------------------------

	var printFormPrice = 0, rollsSum0 = 0;

	// ------------------------------------------------------------

	var gandsMater = gm.get({
		"type":["material-paper","materials:print"],
		"cop":[
			new RegExp("^07","gi")
		]
	});

	// Получение цены материала
	if (  !gm.dataReferences.has(material)  ){
		return new Error("!material.found");
	}
	var materPrice = gm.dataReferences.get(material).GSCostSale || gm.dataReferences.get(material).GSCost || 0;

	// Получение цены печатных пластин
	if (  gm.dataReferences.has(printForm)  ){
		printFormPrice = gm.dataReferences.get(printForm).GSCostSale || gm.dataReferences.get(printForm).GSCost || 0;
	}

	// ------------------------------------------------------------

	var paperAmount = (amount / format_k) + cConst.OFFSET_PREPRINT_PAPER_AMOUNT; // + допечатная подготовка
	var paperSum = paperAmount * materPrice;

	// ------------------------------------------------------------

	var rollGSID = [];

	if (configRow){
		rollGSID = gm.getProperty(configRow, "код-листопроход");
		if (rollGSID.length) rollGSID = eval("("+rollGSID[0].value+")");
	}

	if (!rollGSID.length) rollGSID = /ПЗРАЛП/gi; // листопроход по-умолчанию

	for(c=0; c<gandsMater.length; c++){

		// Получение цены листопрохода
		if (  gandsMater[c].GSID.match(rollGSID)  ){
			for(v=0; v<gandsMater[c].gandsPropertiesRef.length; v++){
				if (  gandsMater[c].gandsPropertiesRef[v].property.match(/Способ печати/gi)  ){
					if (  gandsMater[c].gandsPropertiesRef[v].value.match(/офсет/gi)  ){
						rollsSum0 = cDef.calc({
								"salePrice": true,
								"amount": paperAmount,
								"GSID": gandsMater[c].GSID
							}).sum || cDef.calc({
								"salePrice": false,
								"amount": paperAmount,
								"GSID": gandsMater[c].GSID
							}).sum;
						// rollsPrice = tmp; //.sum gandsMater[c].GSCostSale || gandsMater[c].GSCost;
						break;
					}
				}
			}
		}

	}

	// ------------------------------------------------------------
	// Количество и стоимость пластин
	// var printFormAmount = (colorCode[0] + colorCode[1]) * amount;
	var printFormSum = (colorCode[0] + colorCode[1]) * printFormPrice;

	// ------------------------------------------------------------
	// Количество листопроходов
	var rollsSum = rollsSum0 * (colorCode[0] > 0 && colorCode[1] > 0 ? 2 : 1);

	// ------------------------------------------------------------
	// Результат

	var sum = paperSum + rollsSum + printFormSum;

	var discount = !isNaN(arg.discount) ? +arg.discount : 0;

	sum = sum - (sum * (discount / 100));

	return Math.round(sum * 100) / 100;
};

module.exports = CPOffset;