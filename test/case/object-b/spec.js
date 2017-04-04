describe("ObjectB", function() {
	var fom, obj, key1, key2, ObjectB;

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();

		ObjectB = fom._getModule("ObjectB");

		obj = new ObjectB();
		key1 = { "a": 1 };
		key2 = fom.create("ObjectA", { "a": 1 });
	});


	describe(".set()", function() {
		it(".set(Object, 100)", function() {
			obj.set(key1, 100);
			obj.set(key2, 200);
			obj.set(key2, 200);
			assert.ok(obj._keys.indexOf(key1) > -1);
			assert.ok(obj._keys.indexOf(key2) > -1);
		});
	});

	describe(".get()", function() {
		it(".get(Object) == 100", function() {
			assert.equal(obj.get(key1), 100);
			assert.equal(obj.get(key2), 200);
		});
	});

	describe(".getLength()", function() {
		it(".getLength() == 2", function() {
			assert.equal(obj.getLength(), 2);
		});
	});

	describe("remove(), .getLength()", function() {
		it("remove(Object), .getLength() == 1", function() {
			obj.remove(key2);
			obj.remove(key2);
			assert.ok(obj._keys.indexOf(key2) == -1, 1, "remove");
			assert.equal(obj.getLength(), 1, "remove");
		});
	});

	describe(".has()", function() {
		it(".has(Object) == true", function() {
			assert.ok(
				obj.has(key1),
				"has.true"
			);
		});
		it(".has(DeletedObject) == false", function() {
			assert.ok(
				!obj.has(key2),
				"has.false"
			);
		});
	});
});