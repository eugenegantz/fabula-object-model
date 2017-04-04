describe("utils", function() {
	var fom, gm, _utils;

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		gm = fom.create("GandsDataModel");
		gm.sql = "SELECT * FROM Gands";
		_utils = fom.create("utils");
	});

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
