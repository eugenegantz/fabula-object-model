describe("DBModel", function() {
	var fom,
		db,
		modPath = require("path");

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		db = require(modPath.join(__root, "./nodejs/DBModel"))
			.prototype
			.getInstance(globFabulaObjectModelConfig);
	});

	it("DBModel.dbquery / SELECT NOW();", function(done) {
		db.dbquery({
			"query": "SELECT CURRENT_TIMESTAMP;",
			"callback": (dbres)=> {
				if (dbres.recs.length != 1) {
					throw new Error("dbres.recs.length != 1");
				}

				done();
			}
		});
	});
});