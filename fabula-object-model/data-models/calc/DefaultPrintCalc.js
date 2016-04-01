var GandsDataModel = require("./../GandsDataModel");

var DefaultPrintCalc = function(){
	this.instances.push(this);
};


DefaultPrintCalc.prototype.instances = [];


DefaultPrintCalc.prototype.getInstance = function(){
	return this.instances.length ? this.instances[0] : new DefaultPrintCalc();
};


/**
 * @param {Object} arg
 * @param {Number, String} arg.amount - количество
 * @param {String} arg.GSID - номер в номенклатуре
 * */
DefaultPrintCalc.prototype.calc = function(arg){

	if (typeof arg != "object") {
		throw new Error("1st argument suppose to be Object");
	}

	// ---------- Количество
	if (
		typeof arg.amount == "undefined"
		|| isNaN(arg.amount)
	) {
		throw new Error("arg.amount suppose to be Numeric");
	}

	var argAmount = +arg.amount;

	// ---------- Код в номенклатуре
	if (
		typeof arg.GSID != "string"
		|| !arg.GSID
	){
		throw new Error("arg.GSID suppose to be String");
	}

	var argGSID = arg.GSID;

	// ---------- Расход / Доход
	var salePrice = true;
	if (typeof arg.salePrice != "undefined") salePrice = Boolean(arg.salePrice);

	var gandsM = GandsDataModel.prototype.getInstance();

	if (  !gandsM.dataReferences.has(argGSID)  ){
		return 0;
	}

	var gandsRow = gandsM.dataReferences.get(argGSID);

	var prices = {
		"price": salePrice ? gandsRow.GSCostSale : gandsRow.GSCost,
		"gsCost": gandsRow.GSCost,
		"gsCostSale": gandsRow.GSCostSale
	};

	prices.sum = prices.price * argAmount;

	var loopPrice, loopAmount, cost = 0, kol = 0;

	gandsRow.gandsExtRef.sort(function(a, b){
		return a.GSExSort - b.GSExSort;
	});

	for(var c=0; c<gandsRow.gandsExtRef.length; c++) {
		loopPrice = +gandsRow.gandsExtRef[c].GSExNum;
		loopAmount = +gandsRow.gandsExtRef[c].GSExSort;

		// Цена покупки
		if (
			!salePrice
			&& gandsRow.gandsExtRef[c].GSExType.toLowerCase().trim() == "цена продажи"
		) {
			continue;
		}

		// Цена продажи
		if (
			salePrice
			&& gandsRow.gandsExtRef[c].GSExType.toLowerCase().trim() != "цена продажи"
			&& gandsRow.gandsExtRef[c].GSExType.toLowerCase().trim() != "цена"
		) {
			continue;
		}

		// ------------------------------------------------------------
		// Автор блока: Миланин Альберт
		{

			if (argAmount >= loopAmount) {
				cost = loopPrice;
				kol = loopAmount;

			} else if (argAmount <= loopAmount) {
				try {
					if (cost == 0) {
						cost = loopPrice / ( loopAmount || 1 ) * argAmount;

					} else {
						cost = cost + ( loopPrice - cost ) * ( argAmount - kol ) / ( loopAmount - kol );

					}

					kol = argAmount;
				}
				catch (ex) {
					console.error(ex);
				}
				break;
			}

		}

	} // close.loop

	var ret = {
		"price": prices.price,
		"sum": prices.sum
	};

	if (  cost  ) {
		ret.sum = cost;
		ret.price = cost / (( argAmount > kol ) ? kol : argAmount) || 1;
	}

	return ret;

};

module.exports = DefaultPrintCalc;
