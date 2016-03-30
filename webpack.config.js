var modWebpack = require("webpack");

module.exports = [
	{
		entry: "./fabula-object-model/browser/FabulaObjectModel.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model.bundle.js",
			pathinfo: true,
			sourceMapFilename: "[file].map"
		},
		devtool: "source-map"
	},
	{
		entry: "./fabula-object-model/browser/FabulaObjectModel.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model.bundle.min.js"
		},
		plugins: [
			new modWebpack.optimize.UglifyJsPlugin()
		]
	}
];