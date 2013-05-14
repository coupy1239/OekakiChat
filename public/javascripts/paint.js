document.addEventListener('DOMContentLoaded', function(){
  var imgarr = [];
  imgarr = {'gnh':new Image()};
  imgarr['gnh'].src = '/img/hibiki.png';
  //console.log(imgarr['gnh']);
  
  var randomID = Math.random();
  
  var paint = new io.connect('/paint');
  //受信
  paint.on('paint points', function(data) {
    if(data[0].rid != randomID) {
        for(var i in data) painting(data[i]);
    }
  });
  
  var bufpts = new Array();

  var canvas = document.getElementById('p1');
  var context = canvas.getContext('2d');
  
  /*ここに白背景描画を書く*/
  context.fillStyle = "white";
  context.fillRect(0,0,canvas.width,canvas.height);
  
  var mousecanvas = document.getElementById('p2');
  var ctxm = mousecanvas.getContext('2d');
    
  var brushsize = 4;

  context.lineWidth = 4;
  context.lineCap = 'round';
  context.fillStyle = 'black';
  context.strokeStyle = 'black';
  
  var mycolor = 'black';

  var positioning = null;
  var drawing = false;
  var selecting = false;
  var buffering = false;
  var clearing = false;
  
  var cs = document.getElementById('cs'); 
  var bs = document.getElementById('select');
  
  var mousepointer = function(event){
        event.preventDefault();
        var positions = position(event);    
        if (bs.value == 'pen') {
            ctxm.fillStyle = cs.style.backgroundColor;
            ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
            ctxm.beginPath();
            ctxm.arc(positions.x, positions.y, brushsize / 2, 0, Math.PI * 2, true);
            ctxm.fill();
        }
        else if (bs.value == 'eraser'){
            ctxm.strokeStyle = 'black';
            ctxm.fillStyle = 'white';
            ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
            ctxm.beginPath();
            ctxm.arc(positions.x, positions.y, brushsize / 2, 0, Math.PI * 2, true);
            ctxm.stroke();
            ctxm.fill();
        }
        else if (bs.value == 'gnh'){
            ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
            ctxm.drawImage(imgarr['gnh'],positions.x-imgarr['gnh'].width*brushsize/4/2,positions.y-imgarr['gnh'].height*brushsize/4/2,imgarr['gnh'].width*brushsize/4,imgarr['gnh'].height*brushsize/4);
        }
  };
  
  //mouse
  mousecanvas.addEventListener('mousedown', function(event) {
    drawing = true;
    if(bs.value=='pen') drawArc(event,cs.style.backgroundColor);
    if(bs.value=='eraser') drawArc(event,'white');
    if(bs.value=='gnh'){
        event.preventDefault();
        positioning = position(event);
        var points = {
        s: 'stamp'
      , x: positioning.x
      , y: positioning.y
      , w: brushsize
      , id: canvas.id
      , rid: randomID
      , img:'gnh'
        }
        //paint.json.emit('paint points', points);
        buffer(points);
        painting(points); 
    } 
  }, false);

  mousecanvas.addEventListener('mousemove', function(event) {
    mousepointer(event);
    if (drawing == true) {
      if(bs.value=='pen') drawLine(event,cs.style.backgroundColor);
      if(bs.value=='eraser') drawLine(event,'white');
    }
  }, false);

  mousecanvas.addEventListener('mouseup', function(event) {
    if (drawing == true) {
      if(bs.value=='pen') drawLine(event,cs.style.backgroundColor);
      if(bs.value=='eraser') drawLine(event,'white');
      drawing = false;
    }
  }, false);
    
  mousecanvas.addEventListener('mouseout', function(event) {
    if (drawing == true) {
      if(bs.value=='pen') drawLine(event,cs.style.backgroundColor);
      if(bs.value=='eraser') drawLine(event,'white');
      drawing = false;
    }
    ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
  }, false);
  
  //画像表示
  var save = document.getElementById('save');
  save.addEventListener('click', function() {
    var url = canvas.toDataURL();
    window.open(url,'data url');
  }, false);
  
  //クリア
  var clear = document.getElementById('clear');
  clear.addEventListener('click', function() {
    if(!clearing){
      var date = new Date();
      var points = {
          s: 'clear'
        , id: canvas.id
        , rid: randomID
        , url: canvas.toDataURL()
        , time: yyyymmddhhmiss()
      };
      //paint.json.emit('paint points', points);
      buffer(points);
      painting(points);
    }
  }, false);
  
  //ログ表示
  var log = document.getElementById('log');
  log.addEventListener('click',function(){
      window.open('/log/page1',null);
  },false);
  
  //ブラシサイズ選択
  /*  
  var brushslider = document.getElementById('brushsize');
  brushslider.addEventListener('change',function(event){
      brushsize = brushslider.value;
  });
  */
  $('#brushsize').slider({
      min:1,
      max:20,
      change:function(event,ui){
          brushsize = ui.value;
      }
  });

  function drawArc(event,color) {
    event.preventDefault();
    positioning = position(event);
    var points = {
        s: 'arc'
      , x: positioning.x
      , y: positioning.y
      , w: brushsize
      , c: color
      , id: canvas.id
      , rid: randomID
    }
    //paint.json.emit('paint points', points);
    buffer(points);
    painting(points);
  }

  function drawLine(event,color) {
    event.preventDefault();
    var positions = position(event);
    var points = {
        s: 'line'
      , x: positions.x
      , y: positions.y
      , xp: positioning.x
      , yp: positioning.y
      , w:  brushsize
      , c: color
      , id: canvas.id
      , rid: randomID
    }
    //paint.json.emit('paint points', points);
    buffer(points)
    painting(points);
    positioning = points;
  }

  function painting(points) {
    clearing = false;
    if (canvas.id == points.id) {
      context.lineWidth = points.w;
      switch (points.s) {
      case 'line':
        context.strokeStyle = points.c;
        context.fillStyle = points.c;        
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
        context.strokeStyle = points.c;
        context.fillStyle = points.c;
        context.beginPath();
        context.arc(points.x, points.y, context.lineWidth/2, 0, Math.PI*2, true);
        context.fill();
        context.beginPath();
        context.moveTo(points.x, points.y);
        break;
      case 'stamp':
        context.drawImage(imgarr[points.img],points.x-imgarr['gnh'].width*points.w/4/2,points.y-imgarr['gnh'].height*points.w/4/2,imgarr['gnh'].width*points.w/4,imgarr['gnh'].height*points.w/4);
        break;
      case 'clear':
        clearing = true;
        context.fillStyle = "rgb(255,255,255)";
        context.fillRect(0,0,canvas.width,canvas.height);
        break;

      }
    }
  }
  
  function buffer(points){
      bufpts.push(points);
      
      if(points.s == 'clear'){
          emitting();
      }else if(!buffering){
          buffering = true;
          setTimeout(function(){emitting()},500);          
      }
  }
  function emitting(){
          paint.json.emit('paint points', bufpts);
          bufpts = [];
          buffering = false;
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

