describe("DBModel", function() {
	var modPath = require("path");
	var db = require(modPath.join(__root, "./nodejs/DBModel"))
		.prototype
		.getInstance({
			"dburl": "http://127.0.0.1:9000/db?",
			"dbname": "well.demo",
			"dbsrc": "main"
		});

	it("DBModel.dbquery / SELECT NOW();", function(done) {
		db.dbquery({
			"query": "SELECT NOW();",
			"callback": (dbres)=> {
				if (dbres.recs.length != 1) {
					throw new Error("dbres.recs.length != 1");
				}
				done();
			}
		});
	});
});