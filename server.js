
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var fs = require('fs');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'socket.io paint'
  });
});

app.get('/log',function(req,res){
    res.render('log',{
        title: 'Image log'
    });
});

app.listen(80);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// Server

var points = [];
var imglog = [];
var io = require('socket.io').listen(app);

paint = io.of('/paint').on('connection', function (socket) {
  if (points.length > 0) {
    for (var i in points) {
      socket.json.emit('paint points', points[i]);
    }
  }

  socket.on('paint points', function(data) {
    points.push(data);
    paint.emit('paint points', data);
    if(data.s == 'clear'){
        var fd = __dirname + '/views/log.jade';
        fs.openSync(fd,'a');
        fs.appendFileSync(fd,'  li\n    a(href = \"' + data.url + '\") ' + data.time + '\n');
        
        var fd = __dirname + '/public/paintlog';
        fs.openSync(fd,'a');
        fs.appendFileSync(fd,'  li\n    a(href = \"' + data.url + '\") ' + data.time + '\n');
        
        points = [];
    }
  });
});