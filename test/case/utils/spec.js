describe("utils", function() {
	var FabulaObjectModel = require(__root);
	var fom = FabulaObjectModel
		.prototype
		.getInstance({
			"dburl": "http://127.0.0.1:9000/db?",
			"dbname": "well.demo",
			"dbsrc": "main"
		});
	var _utils = fom.create("utils");

	describe(".isBrowser()", function() {
		it(".isBrowser() === false", function() {
			assert.ok(_utils.isBrowser() === false);
		});
	});

	describe(".getType", function() {
		it(".getType({}) == object", function() {
			assert.equal(_utils.getType({}), "object");
		});
		it(".getType([]) == array", function() {
			assert.equal(_utils.getType([]), "array");
		});
		it(".getType(null) == null", function() {
			assert.equal(_utils.getType(null), "null");
		});
		it(".getType(new Date()) == date", function() {
			assert.equal(_utils.getType(new Date()), "date");
		});
		it(".getType(\"asd\") == string", function() {
			assert.equal(_utils.getType("asd"), "string");
		});
	});

	// TODO parseArg, getType, DBSecureStr, split, trim

});
