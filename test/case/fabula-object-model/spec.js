describe("fabula-object-model", function() {
	this.timeout(5000);

	var fom, db;

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		fom.create("GandsDataModel").sql = "SELECT * FROM Gands";
		db = fom.getDBInstance();
	});

	describe("FOM", function() {

		it("FOM.create", function() {
			var mov = fom.create("MovDataModel");
			assert.ok(mov instanceof fom.mod.MovDataModel);
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