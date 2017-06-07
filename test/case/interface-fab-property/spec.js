describe("InterfaceFProperty", function() {
	var fom,
		fp,
		lorem_ipsum = "" +
		"Lorem Ipsum is simply dummy text of the printing and typesetting industry. " +
		"Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, " +
		"when an unknown printer took a galley of type and scrambled it to make a type specimen book. " +
		"It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. " +
		"It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, " +
		"and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";

	function getTestsProps() {
		return [
			{ "property": "prop_a", "value": "value_a" },
			{ "property": "prop_b", "value": "value_b" }
		];
	}

	function getTestInst() {
		var fp = fom.create("InterfaceFProperty");

		fp.addFProperty(getTestsProps());

		return fp;
	}

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		fp = fom.create("InterfaceFProperty"); // new InterfaceFProperty();
	});


	describe(".addProperty()", function() {

		describe("аргумент - объект", function() {

			it("Сработало событие; запись занесена в массив; объект отмечен как измененный", function() {
				var eventHasFired = false,
					fp = fom.create("InterfaceFProperty");

				fp.on("add-fab-property", function() {
					eventHasFired = true;
				});

				var props = getTestsProps();

				props.forEach(function(row) {
					fp.addFProperty(row);
				});

				fp._iFPropsData.forEach(function(row, idx) {
					assert.equal(row.get("property"), props[idx].property);
					assert.equal(row.get("value"), props[idx].value);
				});

				assert.ok(eventHasFired);
				assert.equal(fp._iFPropsData.length, 2);
			});

		});

		describe("аргумент - массив", function() {

			it("Сработало событие; запись занесена в массив; объект отмечен как измененный", function() {
				var eventHasFired = false,
					fp = fom.create("InterfaceFProperty");

				fp.on("add-fab-property", function() {
					eventHasFired = true;
				});

				var props = getTestsProps();

				fp.addFProperty(getTestsProps());

				fp._iFPropsData.forEach(function(row, idx) {
					assert.equal(row.get("property"), props[idx].property);
					assert.equal(row.get("value"), props[idx].value);
				});

				assert.ok(eventHasFired);
				assert.equal(fp._iFPropsData.length, 2);
			});

		});

	});


	describe(".getProperty()", function() {

		describe("без аргументов", function() {

			it("вернулись все свойства", function() {
				var fp = fom.create("InterfaceFProperty"),
					props = getTestsProps();

				fp.addFProperty(props);

				fp.getFProperty().forEach(function(row, idx) {
					assert.equal(row.property, props[idx].property);
					assert.equal(row.value, props[idx].value);
				});

				assert.equal(fp._iFPropsData.length, 2);
			});

		});

		describe("аргумент - plain object", function() {

			it("", function() {
				var fp = fom.create("InterfaceFProperty"),
					props = getTestsProps();

				fp.addFProperty(props);

				var res = fp.getFProperty({
					"property": "prop_a",
					"value": "value_a"
				});

				assert.equal(res[0].property, "prop_a");
				assert.equal(res[0].value, "value_a");
				assert.equal(res.length, 1);
			});

		});

		describe("аргумент - ObjectA", function() {

			it("", function() {
				var fp = fom.create("InterfaceFProperty"),
					props = getTestsProps();

				fp.addFProperty(props);

				var res = fp.getFProperty(fp._iFPropsData[0]);

				assert.equal(res[0].property, fp._iFPropsData[0].get("property"));
				assert.equal(res[0].value, "value_a");
				assert.equal(res.length, 1);
			});

		});

	});


	describe(".deleteProperty()", function() {

		describe("без аргументов (удалить все записи)", function() {

			it("приватный массив пустой", function() {
				var fp = getTestInst();

				fp.deleteFProperty();

				assert.equal(fp._iFPropsData.length, 0);
			});

		});

		describe("аргумент - plain object", function() {

			it("останется массив длинной == 1", function() {
				var fp = getTestInst();

				fp.deleteFProperty({
					"property": "prop_a",
					"value": "value_a"
				});

				assert.equal(fp.getFProperty().length, 1);
			});

		});

		describe("аргумент - ObjectA", function() {

			it("останется массив длинной == 1", function() {
				var fp = getTestInst();

				fp.deleteFProperty(fp._iFPropsData[0]);

				assert.equal(fp.getFProperty().length, 1);
			});

		});

	});


	describe(".updateProperty()", function() {

		it("", function() {
			var fp = getTestInst();

			fp.updateFProperty({ "property": "prop_a" }, { "value": "updated" });

			var res = fp.getFProperty({ "value": "updated" });

			assert.equal(res.length, 1);
		});

	});


	describe(".upsertProperty()", function() {

		it("", function() {
			var fp = getTestInst();

			fp.upsertFProperty(
				{ "property": "prop_a" },
				[
					{ "value": "updated" },
					{ "property": "prop_c", "value": "inserted" }
				]
			);

			var res = fp.getFProperty();

			assert.equal(res[0].property, "prop_a");
			assert.equal(res[0].value, "updated");
			assert.equal(res[2].property, "prop_c");
			assert.equal(res[2].value, "inserted");
			assert.equal(res.length, 3);
		});

	});


	describe(".splitProperty()", function() {

		describe("Длинный текст с пробелами", function() {

			it("Разбилось на несколько записей по 120 символов", function() {
				var res = fp.splitProperty({
					"property": "prop_a",
					"value": lorem_ipsum
				});

				res.forEach(function(row) {
					assert.ok(row.get("value").length <= 120);
					assert.equal(row.get("property"), "prop_a");
				});

				assert.ok(res.length > 1);
			});

		});

		describe("Длинный текст без пробелов", function() {

			it("Разбилось на несколько записей по 120 символов", function() {
				var res = fp.splitProperty({
					"property": "prop_a",
					"value": lorem_ipsum.replace(/\s+/ig, "")
				});

				res.forEach(function(row) {
					assert.ok(row.get("value").length <= 120);
					assert.equal(row.get("property"), "prop_a");
				});

				assert.ok(res.length > 1);
			});

		});

	});

});