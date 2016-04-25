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

});