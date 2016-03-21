define(
	[
		"./../DBModel",
		"./../utils",
		"./MovDataModel",
		"./ObjectA"
	],
	function(
		DBModel,
		_utils,
		MovDataModel,
		ObjectA
	){

		// Для совместимости
		var getContextDB = function(){
			if (  this._fabulaInstance ){
				return this._fabulaInstance.getDBInstance();
			}
			return DBModel.prototype.getInstance();
		};


		var MovsDataModel = function(){
			this.instances.push(this);
		};

		MovsDataModel.prototype = {

			"instances": [],

			/**
			 * @param {Object} arg
			 * @param {Object, String} arg.cond - условия выборки
			 * @param {Function=} arg.callback
			 * */
			"get": function(arg){

				var cond = arg.cond || null;
				var sqlCond = arg.sqlCond || null;
				var model = arg.model || null;
				var callback = arg.callback || new Function();
				var top = arg.top || null;

				if (  !isNaN(top)  ) top = parseInt(top);

				var fields = _utils.parseArg({
					"value": arg.fields || null,
					"into": "array",
					"kickEmpty": true,
					"trim": true,
					"delimiters": [";",","," "]
				});

				var tmp, c;

				if (typeof arg != "object") return;

				if (  !Array.isArray(arg)  ){
					arg = [arg];
				}

				var db = getContextDB.call(this);

				var defaultFields = new ObjectA(MovDataModel.prototype.__movDataModelDefaultFields);

				tmp = [];

				for(c=0; c<fields.length; c++){
					if (  defaultFields.has(fields[c])  ){
						tmp.push("[" + fields[c] + "]");
					}
				}
				fields = tmp;

				db.dbquery({
					"query": "SELECT " + (top ? top : "") + " " + fields.join(",") + " FROM Movement",
					"callback": function(dbres){
						if (dbres.info.errors.length){
							callback(dbres.info.errors);
							return
						}
						callback(null);
					}
				});
			},


			"remove": function(){

			}

		};

	}
);