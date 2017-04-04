var GandsDataModel = require("./../GandsDataModel");

var DefaultPrintCalc = function(){
	this.instances.push(this);
};


DefaultPrintCalc.prototype.instances = [];


/**
 * @return {DefaultPrintCalc}
 * */
DefaultPrintCalc.prototype.getInstance = function(){
	return this.instances.length ? this.instances[0] : new DefaultPrintCalc();
};


/**
 * Способ расчета цены через аппроксимацию
 * @param {Object} arg
 * @param {Number} arg.amount - количество
 * @param {String} arg.GSID - код номенклатуры
 * @param {Boolean} arg.salePrice - цена продажи
 * */
DefaultPrintCalc.prototype.calcByApprox = function(arg) {
	if (typeof arg != "object")
		throw new Error("1st argument supposed to be Object");

	if (!isFinite(arg.amount))
		throw new Error("arg.amount supposed to be Numeric");

	if (typeof arg.GSID != "string" || !arg.GSID)
		throw new Error("arg.GSID supposed to be not empty String");

	var gsRow,
		argAmount = arg.amount,
		argGSID = arg.GSID,
		salePrice = true,
		gands = GandsDataModel.prototype.getInstance();

	if (typeof arg.salePrice != "undefined")
		salePrice = !!arg.salePrice;

	if (!(gsRow = gands.dataReferences.get(argGSID)))
		throw new Error("Record with code \"" + argGSID + "\" was not found");

	var c,
		_cont,
		loopPrice,
		loopAmount,
		cost = 0,
		kol = 0;

	gsRow.gandsExtRef.sort(function(a, b) {
		return a.GSExSort - b.GSExSort;
	});

	for (c = 0; c < gsRow.gandsExtRef.length; c++) {
		loopPrice = +gsRow.gandsExtRef[c].GSExNum;
		loopAmount = +gsRow.gandsExtRef[c].GSExSort;

		_cont = 0;

		// Цена продажи
		salePrice
		&& /^\s*цена\s*продажи\s*$/ig.test(gsRow.gandsExtRef[c].GSExType)
		&& (_cont = 1);

		// Цена покупки
		!salePrice
		&& /^\s*цена\s*покупки\s*$/ig.test(gsRow.gandsExtRef[c].GSExType)
		&& (_cont = 1);

		if (!_cont) continue;

		if (argAmount >= loopAmount) {
			cost = loopPrice;
			kol = loopAmount;

		} else if (argAmount <= loopAmount) {
			try {
				cost = cost == 0
					? loopPrice / (loopAmount || 1) * argAmount
					: cost + (loopPrice - cost) * (argAmount - kol) / (loopAmount - kol);

				kol = argAmount;

			} catch (ex) {
				console.error(ex);
			}

			break;
		}
	}

	return {
		"sum": cost,
		"price": cost / (( argAmount > kol ) ? kol : argAmount) || 1
	};
};


/**
 * Способ расчета цены используя поля "Цена продажи", "Цена покупки" в номенклатуре
 * @param {Object} arg
 * @param {Number} arg.amount - количество
 * @param {String} arg.GSID - код номенклатуры
 * @param {Boolean} arg.salePrice - цена продажи
 * */
DefaultPrintCalc.prototype.calcByPriceFields = function(arg) {
	if (typeof arg != "object")
		throw new Error("1st argument suppose to be Object");

	if (!isFinite(arg.amount))
		throw new Error("arg.amount suppose to be Numeric");

	if (typeof arg.GSID != "string" || !arg.GSID)
		throw new Error("arg.GSID suppose to be not empty String");

	var gsRow,
		argAmount = +arg.amount,
		argGSID = arg.GSID,
		salePrice = true,
		gands = GandsDataModel.prototype.getInstance();

	if (typeof arg.salePrice != "undefined")
		salePrice = !!arg.salePrice;

	if (!(gsRow = gands.dataReferences.get(argGSID)))
		throw new Error("Record with code \"" + argGSID + "\" was not found");

	var ret = {
		"price": (salePrice ? gsRow.GSCostSale : gsRow.GSCost) || 0
	};

	ret.sum = result.price * argAmount;

	return ret;
};


/**
 * @param {Object} arg
 * @param {Number, String} arg.amount - количество
 * @param {String} arg.GSID - номер в номенклатуре
 * */
DefaultPrintCalc.prototype.calc = function(arg) {
	if (typeof arg != "object")
		throw new Error("1st argument suppose to be Object");

	if (typeof arg.GSID != "string" || !arg.GSID)
		throw new Error("arg.GSID suppose to be not empty String");

	var tmp,
		gsRow,
		argGSID = arg.GSID,
		gands = GandsDataModel.prototype.getInstance(),
		methodsMap = {
			"таблица": this.calcByApprox,
			"фиксированная цена": this.calcByPriceFields
		},
		methods = [
			"таблица",
			"фиксированная цена",
			"наценка от работы",
			"наценка от материала",
			"наценка от расходов"
		],
		ret = {
			"price": 0,
			"sum": 0
		};

	if (!(gsRow = gands.dataReferences.get(argGSID)))
		throw new Error("Record with code \"" + argGSID + "\" was not found");

	if (tmp = gands.getProperty(gsRow, "способ наценки")[0]) {
		methods = tmp.split(/[;,]\s*/ig);

		methods.some(method => {
			if (!methodsMap[method]) return;

			ret = methodsMap[method].call(this, arg);

			return true;
		});
	}

	return ret;
};

module.exports = DefaultPrintCalc;