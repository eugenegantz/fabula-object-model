var modFs = require("fs"),
	modHttp = require("http"),
	modPath = require("path");

modHttp.createServer(function (req, res) {
	var path = req.url.split("?")[0];
	path = modPath.join(__dirname, "./../../", path);

	var ext = modPath.extname(path).toLowerCase();
	modFs.readFile(path, function (err,data) {
		if (err) {
			res.writeHead(404);
			res.end(JSON.stringify(err));
			return;
		}

		if (  ext == ".css"  ){
			res.setHeader("Content-type","text/css");

		} else if (  ext == ".html"  ){
			res.setHeader("Content-type","text/html");

		} else if (  ext == ".txt"  ){
			res.setHeader("Content-type","text/plain");

		} else if (  ext == ".js"  ){
			res.setHeader("Content-type","application/javascript");

		} else if (  ext == ".json"  ){
			res.setHeader("Content-type","application/json");

		}

		res.writeHead(200);
		res.end(data);
	});
}).listen(8080);

console.log("http://localhost:8080/test/browser/index.html");