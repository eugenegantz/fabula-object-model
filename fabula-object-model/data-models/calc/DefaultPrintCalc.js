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

	var table = void 0;
	var cost = 0;
	var kol = 0;

	gsRow.gandsExtRef.sort(function(a, b) {
		return a.GSExSort - b.GSExSort;
	});

	gsRow.gandsExtRef.some(function(gsExtRow) {
		if ('property' != gsExtRow.GSExType)
			return;

		// Цена продажи
		if (salePrice && /^\s*цена\s*продажи\s*$/ig.test(gsExtRow.GSExName))
			return table = gsExtRow.GSExAttr1;

		// Цена покупки
		if (!salePrice && /^\s*цена\s*покупки\s*$/ig.test(gsExtRow.GSExName))
			return table = gsExtRow.GSExAttr1;
	});

	if (!table) {
		return {
			"sum": 0,
			"price": 0
		};
	}

	table = table.trim().split(";");

	table.some(function(row) {
		row = row.trim().replace(/[\001\011]/ig, '');

		if (!row)
			return;

		row = row.split(",");

		var loopAmount = +row[0].trim();
		var loopPrice = +row[1].trim();

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

			return true;
		}
	});

	return {
		"sum": cost,
		"price": (cost / ((( argAmount > kol ) ? kol : argAmount) || 1)) || 0
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

	ret.sum = ret.price * argAmount;

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
		_this = this,
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

	if ((tmp = gands.getProperty(gsRow, "способ наценки")[0]))
		methods = tmp.value.split(/[;,]\s*/ig);

	methods.some(function(method) {
		method = method.toLowerCase();

		if (!methodsMap[method])
			return;

		ret = methodsMap[method].call(_this, arg);

		return ret.price;
	});

	return ret;
};

module.exports = DefaultPrintCalc;