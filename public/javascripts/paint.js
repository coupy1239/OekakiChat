document.addEventListener('DOMContentLoaded', function(){

  var paint = new io.connect('/paint');
  paint.on('paint points', function(points) {
    painting(points);
  });

  var canvas = document.getElementById('p1');
  var context = canvas.getContext('2d');
  
  /*ここに白背景描画を書く*/
  
  var mouselayer = document.getElementById('p2');
  var ctxm = mouselayer.getContext('2d');
    
  var brushsize = 4;

  context.lineWidth = 4;
  context.lineCap = 'round';
  context.fillStyle = 'black';
  context.strokeStyle = 'black';
  
  var mycolor = 'black';

  var positioning = null;
  var drawing = false;
  var selecting = false;
  
  var colorselector = document.getElementById('cs');
  
  //mouse
  mouselayer.addEventListener('mousemove',function(event){
      ctxm.fillStyle = colorselector.style.backgroundColor;
      ctxm.clearRect(0, 0, canvas.width, canvas.height);
      ctxm.beginPath();
      ctxm.arc(event.offsetX,event.offsetY,brushsize/2,0, Math.PI*2, true);
      ctxm.fill();
  });

  mouselayer.addEventListener('mousedown', function(event) {
    drawArc(event);
    drawing = true;
  }, false);

  mouselayer.addEventListener('mousemove', function(event) {
    if (drawing == true) {
      drawLine(event);
    }
  }, false);

  mouselayer.addEventListener('mouseup', function(event) {
    if (drawing == true) {
      drawLine(event);
      drawing = false;
    }
  }, false);

  mouselayer.addEventListener('mouseout', function(event) {
    if (drawing == true) {
      drawLine(event);
      drawing = false;
    }
  }, false);

  var save = document.getElementById('save');
  save.addEventListener('click', function() {
    var url = canvas.toDataURL();
    window.open(url,'data url');
  }, false);

  var clear = document.getElementById('clear');
  clear.addEventListener('click', function() {
    var date = new Date();
    var points = {
        s: 'clear'
      , x: positioning.x
      , y: positioning.y
      , c: context.strokeStyle
      , id: canvas.id
      , url: canvas.toDataURL()
      , time: yyyymmddhhmiss()
    };
    paint.json.emit('paint points', points);
    painting(points);    
  }, false);
  
  var log = document.getElementById('log');
  log.addEventListener('click',function(){
      window.open('/log',null);
  },false);
  
  //color
  /*var colors = document.getElementById('colors').childNodes;
  for (var i = 0, color; color = colors[i]; i++) {
    if (color.nodeName.toLowerCase() != 'div') continue;
    color.addEventListener('click', function (event) {
      var style = event.target.getAttribute('style');
      var color = style.match(/background:(#......)/)[1];
      mycolor = color;
    }, false);
  }*/
    
  var brushslider = document.getElementById('brushsize');
  brushslider.addEventListener('change',function(event){
      brushsize = brushslider.value;
  });

  function drawArc(event) {
    event.preventDefault();
    positioning = position(event);
    var points = {
        s: 'arc'
      , x: positioning.x
      , y: positioning.y
      , w: brushsize
      , c: colorselector.style.backgroundColor
      , id: canvas.id
    }
    paint.json.emit('paint points', points);
    painting(points);
  }

  function drawLine(event) {
    event.preventDefault();
    var positions = position(event);
    var points = {
        s: 'line'
      , x: positions.x
      , y: positions.y
      , xp: positioning.x
      , yp: positioning.y
      , w:  brushsize
      , c: colorselector.style.backgroundColor
      , id: canvas.id
    }
    paint.json.emit('paint points', points);
    painting(points);
    positioning = points;
  }

  function painting(points) {
    if (canvas.id == points.id) {
      context.strokeStyle = points.c;
      context.fillStyle = context.strokeStyle;
      context.lineWidth = points.w;
      switch (points.s) {
      case 'line':        
        context.beginPath();
        context.moveTo(points.x, points.y);   
        context.lineTo(points.xp, points.yp);
        context.closePath();
        context.stroke();
        context.beginPath();
        context.arc(points.x, points.y, context.lineWidth/2, 0, Math.PI*2, true);
        context.fill();
        context.arc(points.xp, points.yp, context.lineWidth/2, 0, Math.PI*2, true);
        context.fill();
        break;
      case 'arc':
        context.beginPath();
        context.arc(points.x, points.y, context.lineWidth/2, 0, Math.PI*2, true);
        context.fill();
        context.beginPath();
        context.moveTo(points.x, points.y);
        break;
      case 'clear':
        context.clearRect(0, 0, canvas.width, canvas.height);
        break;
      }
    }
  }
}, false);

function position(event) {
  var rect = event.target.getBoundingClientRect();
  return {
      x: event.clientX - rect.left
    , y: event.clientY - rect.top
  }
}

var toDoubleDigits = function(num) {
  num += "";
  if (num.length === 1) {
    num = "0" + num;
  }
 return num;     
};

var yyyymmddhhmiss = function() {
  var date = new Date();
  var yyyy = date.getFullYear();
  var mm = toDoubleDigits(date.getMonth() + 1);
  var dd = toDoubleDigits(date.getDate());
  var hh = toDoubleDigits(date.getHours());
  var mi = toDoubleDigits(date.getMinutes());
  var ss = toDoubleDigits(date.getSeconds());
  return yyyy + '-' + mm + '-' + dd + ' ' + hh + '.' + mi + '.' + ss;
};

