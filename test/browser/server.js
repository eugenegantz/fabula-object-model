var modFs = require("fs"),
	modHttp = require("http"),
	modPath = require("path");

modHttp.createServer(function (req, res) {
	var path = modPath.join(__dirname, "./../../", req.url);
	modFs.readFile(path, function (err,data) {
		if (err) {
			res.writeHead(404);
			res.end(JSON.stringify(err));
			return;
		}
		res.writeHead(200);
		res.end(data);
	});
}).listen(8080);

console.log("http://localhost:8080/test/browser/index.html");