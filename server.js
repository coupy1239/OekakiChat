//var http = require('http'),fs = require('fs');

/*var app = http.createServer(function (req, res) {
  fs.readFile('./index.html', 'UTF-8', function(err, data) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(data);
  });
});
*/
var app = require('express').createServer()
  , io = require('socket.io').listen(app);
app.listen(8124);
 
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

//app.listen(80);
