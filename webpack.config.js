var modWebpack = require("webpack");
var modPath = require("path");

module.exports = [
	{
		entry: "./fabula-object-model/browser/FabulaObjectModel.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model.bundle.js",
			pathinfo: true,
			sourceMapFilename: "[file].map"
		},
		"if-loader" : "browser",
		module: {
			preLoaders: [
				{
					// the "loader"
					loader: modPath.resolve(__dirname, "./webpack-loaders/if-loader-master/")
				}
			]
		},
		devtool: "source-map"
	},

	
	{
		entry: "./fabula-object-model/browser/FabulaObjectModel.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model.bundle.min.js"
		},
		"if-loader" : "browser",
		module: {
			preLoaders: [
				{
					// the "loader"
					loader: modPath.resolve(__dirname, "./webpack-loaders/if-loader-master/")
				}
			]
		},
		plugins: [
			new modWebpack.optimize.UglifyJsPlugin()
		]
	},
	
	
		{
		entry: "./fabula-object-model/browser/FabulaObjectModel.js",
		output: {
			path: "./bundles/",
			filename: "fabula-object-model-s.bundle.js",
			pathinfo: true,
			sourceMapFilename: "[file].map"
		},
		"if-loader" : "browser-s",
		module: {
			preLoaders: [
				{
					// the "loader"
					loader: modPath.resolve(__dirname, "./webpack-loaders/if-loader-master/")
				}
			]
		},
		devtool: "source-map"
	},
];