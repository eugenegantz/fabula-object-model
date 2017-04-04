describe("fabula-object-model", function() {

	var FabulaObjectModel = require(__root),
		fom = FabulaObjectModel
			.prototype
			.getInstance({
				"dburl": "http://127.0.0.1:9000/db?",
				"dbname": "well.demo",
				"dbsrc": "main"
			});

	fom.create("GandsDataModel").sql = "SELECT * FROM Gands";

	describe("FOM", function() {

		var db = fom.getDBInstance();

		it("FOM.create", function() {
			var mov = fom.create("MovDataModel");
			assert.ok(mov instanceof fom.mod.MovDataModel);
		});

		it("MovDataModel", function(done) {
			db.dbquery({
				"query": "SELECT TOP 5 MMID FROM Movement ORDER BY GSDate DESC",
				"callback": (dbres)=> {
					var mov = fom.create("MovDataModel");
					mov.set("MMID", dbres.recs[0].MMID);
					mov.load({
						callback: function() {
							if (!mov.get("GS")) {
								throw new Error('!mov.get("GS")');
							}
							done();
						}
					});
				}
			})
		});

	});

	describe(".getInstance()", function() {
		it(".prototype.getInstance()", function() {
			assert.ok(Boolean(fom));
		});
	});

	describe(".load()", function() {
		it(".load()", function(done) {
			fom.load({
				"callback": function(err) {
					if (err)
						throw new Error("fom.load(err)");

					done();
				}
			});
		});
	});
});