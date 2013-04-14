var http = require('http');

http.createServer(function (req, res) {
  fs.readFile('./HTMLPage.html', 'UTF-8', function(err, data) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(data);
  });
  
}).listen(80);