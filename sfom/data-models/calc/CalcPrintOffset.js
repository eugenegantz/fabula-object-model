define(
	[
		"./../GandsDataModel"
	],
	function(
		GandsDataModel
	) {

		var gandsM = GandsDataModel.prototype.getInstance();

		/**
		 * @param {Object} arg
		 * @param {String} arg.format
		 * @param {String} arg.collageFormat
		 * */
		var CalcPrintOffset = function (arg) {
			this.components = [];
			this.constrArg = typeof arg == "object" ? arg : Object.create(null);
		};

		var proto = {};

		proto.calc = function (arg) {
			var collageFormat = arg.collageFormat || this.collageFormat;
			var format = arg.format || this.collageFormat;
		};

		/**
		 * @param {Object} component
		 * */
		proto.addComponent = function(component){
			this.components.push(component);
		};

		CalcPrintOffset.prototype = proto;

		return null;
	}
);