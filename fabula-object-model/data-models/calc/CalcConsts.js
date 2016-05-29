// TODO коды брать из Настройки FOM из Fabula

module.exports = {

	_init: function(){
		var gdm = require("./../GandsDataModel").prototype.getInstance();
		var fomConfig = gdm.get({"group":["fom-config"]});
		var cConst = module.exports;
		for(var c=0; c<fomConfig.gandsPropertiesRef.length; c++){
			var prop = fomConfig.gandsPropertiesRef[c];
			if (  prop.property.match(/код-бигование-1/ig)  ){
				cConst.POSTPROC_CREASING_V1_GSID = prop.value;

			} else if (  prop.property.match(/код-бигование-2/ig)  ){
				cConst.POSTPROC_CREASING_V2_GSID = prop.value;

			} else if (  prop.property.match(/код-закругление-углов-ручное/ig)  ) {
				cConst.POSTPROC_ROUNDING_H_GSID = prop.value;

			} else if (  prop.property.match(/код-ламинация-1-стор/ig)  ) {
				cConst.POSTPROC_LAMINATING_1_SIDE_GSID = prop.value;

			} else if (  prop.property.match(/код-ламинация-2-стор/ig)  ) {
				cConst.POSTPROC_LAMINATING_2_SIDE_GSID = prop.value;

			} else if (  prop.property.match(/тираж-предпечатной-подготовки-офсет/ig)  ) {
				cConst.OFFSET_PREPRINT_PAPER_AMOUNT = prop.value;

			} else if (  prop.property.match(/макс-тираж-циф-печати/ig)  ) {
				cConst.DIGITAL_PRINT_MAX_AMOUNT = prop.value;
			}
		}
		Object.freeze(cConst);
	},

	DIGITAL_PRINT_MAX_AMOUNT: 250, // TODO Занести в ТехСправ

	DIGITAL_PRINT: "DIGITAL",

	OFFSET_PREPRINT_PAPER_AMOUNT: 250, // TODO Занести в ТехСправ

	OFFSET_PRINT: "OFFSET",

	CARTON_PRINT: "CARTON",

	// ---------------------------------------------------------------

		POSTPROC_LAMINATING: "LAMINATING",

		// Задействовано в классе ламинация
		POSTPROC_LAMINATING_1_SIDE_GSID: "ПЗРАЛАЛ1",

		POSTPROC_LAMINATING_2_SIDE_GSID: "ПЗРАЛАЛ2",

		POSTPROC_LAMINATING_CUSTOM_GSID: "ПЗРАЛАГЛ",

		// .......................................

		// Задействовано в классе бигование
		POSTPROC_CREASING: "CREASING",

		POSTPROC_CREASING_V1_GSID: "ПЗРАБИБ1",

		POSTPROC_CREASING_V2_GSID: "ПЗРАБИБ2",

		// .......................................

		POSTPROC_FOLDING: "FOLDING",

		POSTPROC_FOLDING_M_GSID: "ПЗРАФаФ1", // Не используется

		POSTPROC_FOLDING_H_GSID: "ПЗРАФаФ2", // Не используется

		// .......................................

		POSTPROC_ROUNDING: "ROUNDING",

		POSTPROC_ROUNDING_H_GSID: "ПЗРАПоПР", // Не используется

	// ---------------------------------------------------------------

	RISOGRAPH_PRINT: "RISOGRAPH"

};

// Object.freeze(module.exports);