describe("PrintUtils", function() {
	var fom, gm, PrintUtils;

	before(function() {
		fom = globTestUtils.getFabulaObjectModel();
		gm = fom.create("GandsDataModel");
		gm.sql = "SELECT * FROM Gands";
		fom.create("GandsDataModel").sql = "SELECT * FROM Gands";
		PrintUtils = fom._getModule("PrintUtils");
	});





	describe(".getFormats()", function() {
		it(".getFormats()", function() {
			assert.ok(
				Object.keys(PrintUtils.getFormats()).length > 0
			);
		});
	});

	describe(".getFormat", function() {
		it(".getFormat('ТСПоФмА3') == Object", function() {
			assert.equal(typeof PrintUtils.getFormat('ТСПоФмА3'), "object");
		});
	});

	describe(".formatFill", function() {
		it(".formatFill(A3, A4)", function() {
			assert.equal(PrintUtils.formatFill('ТСПоФмА3', 'ТСПоФмА4'), 2);
		});
		it(".formatFill(A3, A5)", function() {
			assert.equal(PrintUtils.formatFill('ТСПоФмА3', 'ТСПоФмА5'), 4);
		});
		it(".formatFill(A3, A6)", function() {
			assert.equal(PrintUtils.formatFill('ТСПоФмА3', 'ТСПоФмА6'), 8);
		});
	});
});