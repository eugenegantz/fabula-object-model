describe("FOM", function(){

	var fom = FabulaObjectModel
		.prototype
		.getInstance({
			"dburl": "http://127.0.0.1:8100/db?",
			"dbname": "well.demo",
			"dbsrc": "main"
		});

	var db = fom.getDBInstance();

	it ("test", function(){
		assert.ok(1==true);
	});

	it("FOM.create", function(){
		var mov = fom.create("MovDataModel");
		assert.ok(  mov instanceof fom.mod.MovDataModel  );
	});

	it("MovDataModel", function(done){
		db.dbquery({
			"query": "SELECT TOP 5 MMID FROM Movement ORDER BY GSDate DESC",
			"callback": function(dbres){
				var mov = fom.create("MovDataModel");

				if (!dbres.recs.length){
					throw new Error("!dbres.recs.length");
				}

				mov.set("MMID", dbres.recs[0].MMID);
				mov.load({
					callback: function(){
						if (!mov.get("GS")){
							throw new Error('!mov.get("GS")');
						}
						done();
					}
				});
			}
		})
	});

});