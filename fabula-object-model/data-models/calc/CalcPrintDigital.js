var CPDigital = function(){};

CPDigital.prototype.calc = function(arg){
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

	var materPrice = null, rollsPrice = null;

	// ------------------------------------------------------------
	// Количество и стоимость листов;
	var gandsMater = Gm.get({
		"type":["material-paper","materials:print"],
		"cop":[
			new RegExp("^07","gi")
		]
	});

	var selected = {"color": false, "method": false, _break: false};

	// TODO сделать правильную выборку по цвету

	for(c=0; c<gandsMater.length; c++){

		// Получение цены листопрохода
		if (  gandsMater[c].GSID.match(/ПЗРАЛП/gi)  ){

			for(v=0; v<gandsMater[c].gandsPropertiesRef.length; v++){

				if (
					gandsMater[c].gandsPropertiesRef[v].property.match(/^Способ печати$/gi)
					&& gandsMater[c].gandsPropertiesRef[v].value.match(/^цифра$|^цифровая печать$/gi)
				){
					selected.method = true;
				}

				if (  gandsMater[c].gandsPropertiesRef[v].property.match(/^Цветность$/gi)  ){
					if (
						colorCode[0] <= 1
						&& colorCode[1] <= 1
						&& gandsMater[c].gandsPropertiesRef[v].value.match(/^ЧБ$|^Ч\/Б$/gi)
					){
						selected.color = true;
						selected._break = true;
					}

					if (
						!selected.color
						&& (
							colorCode[0] >= 1
							|| colorCode[1] >= 1
						)
						&& gandsMater[c].gandsPropertiesRef[v].value.match(/^Полноцвет$|^Цвет$/gi)
					){
						selected.color = true;
						selected._break = colorCode[0] > 1 || colorCode[1] > 1;
					}
				}

				if (selected.color && selected.method && selected._break) break;

			} // close.loop.gandsProps

			if (selected.color && selected.method){
				rollsPrice = gandsMater[c].GSCostSale || gandsMater[c].GSCost;
				if (selected._break) break;
			}

		} // close.loop.gandsMater

	}

	// Получение цены материала
	if (  !Gm.dataReferences.has(material)  ){
		return new Error("!material.found");
	}
	materPrice = Gm.dataReferences.get(material).GSCostSale || Gm.dataReferences.get(material).GSCost;

	if (rollsPrice === null){
		return new Error("!rolls.found");
	}

	var paperAmount = (amount / format_k) + 250; // + допечатная подготовка
	var paperSum = paperAmount * materPrice;

	// ------------------------------------------------------------
	// Количество листопроходов
	var rollsSum = (paperAmount * rollsPrice) * (colorCode[0] > 0 && colorCode[1] > 0 ? 2 : 1);

	// ------------------------------------------------------------
	// Результат

	var sum = paperSum + rollsSum;

	var discount = !isNaN(arg.discount) ? +arg.discount: 0;

	sum = sum - (sum * (discount / 100));

	return Math.round(sum * 1000) / 1000;
};

module.exports = CPDigital;