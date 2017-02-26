module.exports = {

	/**
	 * Выполнить условие из номенклатуры
	 * @param {String} evalStr - выражение, которое необходимо выполнить
	 * @param {Object} ctxVars - переменные, которые необходимо передать в контекст
	 * */
	"eval": function(evalStr, ctxVars) {
		var prop;

		ctxVars = Object.assign({}, this._evalFn, ctxVars);

		for (prop in ctxVars) {
			if (!ctxVars.hasOwnProperty(prop)) continue;

			if (typeof ctxVars[prop] == 'function') {
				eval('var ' + prop + ' = ' + ctxVars[prop]);

				continue;
			}

			eval('var ' + prop + ' = ' + JSON.stringify(ctxVars[prop]));
		}

		return eval(evalStr);
	},


	"_evalFn": {
		"ЕСЛИ": function(cond, expr1, expr2) {
			return cond ? expr1 : expr2;
		},

		"СОДЕРЖИТ": function() {
			// TODO
		}
	}

};