var sys = require('sys');
var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

http.createServer(function(req, res) {
  var uri = url.parse(req.url).pathname;
  /* Redirect */
  if (uri === '/')
    uri = '/index.html';

  //console.log('uri: ' + uri);
  var filename = path.join(process.cwd(), uri);
  path.exists(filename, function(exists) {
    if (!exists) {
      res.writeHead(404, {'Content-Type' : 'text/plain'});
      res.end('404 Not Found\n');
      return;
    }

    fs.readFile(filename, "binary", function(err, file) {
      if (err) {
        res.writeHead(500, {'Content-Type' : 'text/plain'});
        res.end(err + '\n' + 'and shit');
        return;
      }

      res.writeHead(200);
      res.end(file, 'binary');
    });
  });
}).listen(8080);

sys.puts('Server running at http://localhost:8080/');
