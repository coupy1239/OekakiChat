document.addEventListener('DOMContentLoaded', function(){

  var paint = new io.connect('/paint');
  paint.on('paint points', function(points) {
    painting(points);
  });

  var canvas = document.querySelector('canvas');
  var context = canvas.getContext('2d');

  context.lineWidth = 4;
  context.lineCap = 'round';
  context.fillStyle = 'black';
  context.strokeStyle = 'black';

  var positioning = null;
  var drawing = false;

  canvas.addEventListener('mousedown', function(event) {
    drawArc(event);
    drawing = true;
  }, false);

  canvas.addEventListener('mousemove', function(event) {
    if (drawing == true) {
      drawLine(event);
    }
  }, false);

  canvas.addEventListener('mouseup', function(event) {
    if (drawing == true) {
      drawLine(event);
      drawing = false;
    }
  }, false);

  canvas.addEventListener('mouseout', function(event) {
    if (drawing == true) {
      drawLine(event);
      drawing = false;
    }
  }, false);

  var save = document.getElementById('save');
  save.addEventListener('click', function() {
    var url = canvas.toDataURL();
    window.open(url, 'data url');
  }, false);

  var clear = document.getElementById('clear');
  clear.addEventListener('click', function() {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }, false);

  var colors = document.getElementById('colors').childNodes;
  for (var i = 0, color; color = colors[i]; i++) {
    if (color.nodeName.toLowerCase() != 'div') continue;
    color.addEventListener('click', function (event) {
      var style = event.target.getAttribute('style');
      var color = style.match(/background:(#......)/)[1];
      context.strokeStyle = color;
      context.fillStyle = context.strokeStyle
    }, false);
  }

  function drawArc(event) {
    event.preventDefault();
    positioning = position(event);
    var points = {
        s: 'arc'
      , x: positioning.x
      , y: positioning.y
      , c: context.strokeStyle
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
      , c: context.strokeStyle
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
      switch (points.s) {
      case 'line':
        context.beginPath();
        context.moveTo(points.x, points.y);
        context.lineTo(points.xp, points.yp);
        context.closePath();
        context.stroke();
        break;
      case 'arc':
        context.beginPath();
        context.arc(points.x, points.y, context.lineWidth/2, 0, Math.PI*2, true)
        context.fill();
        context.beginPath();
        context.moveTo(points.x, points.y);
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
