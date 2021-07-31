var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    port = process.argv[2] || 8888;


http.createServer(function(request, response) {
    var Response = {
        "200":function(file, filename) {
            var extname = path.extname(filename);
            var header = {
                "Access-Control-Allow-Origin":"*",
                "Pragma": "no-cache",
                "Cache-Control" : "no-cache"
            }
            if (extname == '.jpg') {
                header["Content-Type"] = 'image/jpeg';
            } else if (extname == '.png') {
                header["Content-Type"] = 'image/png';
            } else if (extname == '.css') {
                header["Content-Type"] = 'text/css';
            } else if (extname == '.js') {
                header["Content-Type"] = 'text/javascript';
            } else if (extname == '.json') {
                header["Content-Type"] = 'application/json';
            } else {
                header["Content-Type"] = 'text/html';
            }

            response.writeHead(200, header);
            response.write(file, "binary");
            response.end();
        },
        "404":function() {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();

        },
        "500":function(err) {
            response.writeHead(500, {"Content-Type": "text/plain"});
            response.write(err + "\n");
            response.end();

        }
    }

    var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

    fs.exists(filename, function(exists){
        console.log(filename+" "+exists);
        if (!exists) { Response["404"](); return; }
        if (fs.statSync(filename).isDirectory()) { filename += '/index.html'; }

        fs.readFile(filename, "binary", function(err, file) {
        if (err) { Response["500"](err); return; }
            Response["200"](file, filename);
        });
    });
}).listen(parseInt(port, 10));

console.log("Server running at http://localhost:" + port );
