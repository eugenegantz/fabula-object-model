global.assert = require("assert");
global.modPath = require("path");
global.__root = modPath.join(__dirname, "./../../fabula-object-model");

assert.notOk = function(val) {
	assert.strictEqual(val, false);
};

require('./../case/fabula-object-model/spec.js');
require('./../case/object-a/spec.js');
require('./../case/object-b/spec.js');
require('./../case/db-model/spec.js');
require('./../case/utils/spec.js');
require('./../case/ajax-module/spec.js');
require('./../case/default-data-model/spec.js');
require('./../case/gands-data-model/spec.js');
require('./../case/interface-events/spec.js');
require('./../case/interface-fab-property/spec.js');
require('./../case/mov-data-model/spec.js');
require('./../case/doc-data-model/spec.js');
require('./../case/print-utils/spec.js');
require('./../case/calc/spec.js');