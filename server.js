var http = require('http'),fs = require('fs');

http.createServer(function (req, res) {
  fs.readFile('./index.html', 'UTF-8', function(err, data) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(data);
  });
  
});

var io = require('socket.io').listen(http, { log: false });
io.sockets.on('connection', function (socket) {
    socket.on('pulse', function (data) {
        socket.emit('pulse', data ? data * 2 : 0);
    });
});

http.listen(80);