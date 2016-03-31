var modWebpack = require("webpack");
var modPath = require("path");

module.exports = [
	{
		entry: "./sfom/browser/FabulaObjectModel.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model.s-bundle.js",
			pathinfo: true,
			sourceMapFilename: "[file].map"
		},
		devtool: "source-map"
	}
	/*
	{
		entry: "./sfom/browser/FabulaObjectModel.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model.s-bundle.min.js"
		},
		plugins: [
			new modWebpack.optimize.UglifyJsPlugin()
		]
	}
	*/
];