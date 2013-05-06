
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
        /*
        var b64data = data.url.split(",")[1];
        var buf = new Buffer(b64data,'base64');
        var fd = __dirname + '/public/img/log/' + data.time +'.png';
        fs.openSync(fd,'a');
        fs.appendFileSync(fd,buf);
        
        var fd = __dirname + '/views/log.jade';
        fs.openSync(fd,'a');
        fs.appendFileSync(fd,'  li\n    a(href = \"' + '/img/log/' + data.time + '.png\") ' + data.time + '\n');
        */
       
        //atodekeseu
        var logdata;
        var fd = __dirname + '/public/img/paintlog';
        var utf8log = fs.readFileSync(fd); 
        var strlog = utf8log.toString('utf8');
        var splitlog = strlog.split('\"');
        var buflog = new Array();
        var datearray = new Array();
        for(var i=1;i<splitlog.length;i++){
                    console.log(i);
            if(i%2==1){
                    var b64log = new Buffer(splitlog[i].replace('data:image/png;base64,',''),'base64');
                    buflog.push(b64log);
                    console.log(b64log.toString('hex').substr(0,20));
            }
            else{
                if(splitlog[i]){
                    datearray.push(splitlog[i].substr(2,19));
                    console.log(splitlog[i].substr(2,19)); 
                }
            }     
        }
                    console.log('bufloglength:'+buflog.length);
                    console.log('datearraylength:'+datearray.length);
        for(var i=0;i<datearray.length;i++){
            var fd = __dirname + '/public/img/log/' + datearray[i] +'.png';
            fs.openSync(fd,'a');
            fs.appendFileSync(fd,buflog[i]);
            
            var fd = __dirname + '/views/log.jade';
            fs.openSync(fd,'a');
            fs.appendFileSync(fd,'  li\n    a(href = \"' + '/img/log/' + datearray[i] + '.png\") ' + datearray[i] + '\n');
            
        }
        
        points = [];
    }
  });
});