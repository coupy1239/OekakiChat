var http = require('http'),fs = require('fs');

var app = http.createServer(function (req, res) {
  fs.readFile('./index.html', 'UTF-8', function(err, data) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(data);
  });
  
});
app.listen(80);
