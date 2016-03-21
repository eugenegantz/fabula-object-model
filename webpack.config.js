var modWebpack = require("webpack");

module.exports = [
	{
		entry: "./fabula-object-model/browser/browser.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model.bundle.js",
			pathinfo: true
		}
	},
	{
		entry: "./fabula-object-model/browser/browser.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model.bundle.min.js"
		},
		plugins: [
			new modWebpack.optimize.UglifyJsPlugin()
		]
	}
];