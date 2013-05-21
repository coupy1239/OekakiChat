jQuery(document).ready(function(){
  
  jQuery.noConflict()
  
  ////いろんなもの読み込む////
  
  var browser = navigator.userAgent;//ブラウザ
  console.log(browser);
  
  var paint = new io.connect('/paint');//ソケット
  paint.on('paint points', function(data) {
    if(data[0].rid != randomID) {
        for(var i in data) painting(data[i]);
    }
  });
  
  var imgarr = [];//スタンプ画像
  imgarr = {'gnh':new Image()};
  imgarr['gnh'].src = '/img/hibiki.png';
  
  var randomID = Math.random();//クライアントID
  
  var canvas = document.getElementById('p1');//描画キャンバス
  var context = canvas.getContext('2d');
  context.fillStyle = "white";
  context.fillRect(0,0,canvas.width,canvas.height);
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.fillStyle = 'black';
  context.strokeStyle = 'black';
  
  var mousecanvas = document.getElementById('p2');//カーソル用キャンバス
  var ctxm = mousecanvas.getContext('2d');
  
  var cs = document.getElementById('cs'); //色選択
  
  var bs= document.getElementById('brushgroup');//ブラシ選択
  bs.addEventListener('change',function(event){
      brushstyle = jQuery("#brushgroup input[name='bg']:checked").val();
  });
  
  ////////////
  
  ////変数////
  
  var bufpts = new Array();  
  var brushsize = 4;  
  var mycolor = 'black';
  var brushstyle = 'pen';
  var positioning = null;
  var drawing = false;
  var selecting = false;
  var buffering = false;
  var clearing = false;
  var mouseout = false;
  
  ////////////
  
    
  ////マウスイベント////
  
  mousecanvas.addEventListener('mousedown', function(event) {
    drawing = true;
    if(brushstyle=='pen') drawArc(event,cs.style.backgroundColor);
    if(brushstyle=='eraser') drawArc(event,'white');
    if(brushstyle=='gnh'){
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
    if(brushstyle=='spuit'){
        var imgdata = context.createImageData(1,1);
        event.preventDefault();
        positioning = position(event);
        imgdata = context.getImageData(positioning.x,positioning.y,1,1);
        cs.style.backgroundColor = "rgb("+imgdata.data[0].toString()+','+imgdata.data[1].toString()+','+imgdata.data[2].toString()+')';
        var rgb = new Array();
        for(var i=0;i<3;i++) rgb[i]=toDoubleDigits16(imgdata.data[i].toString(16));
        cs.value = "#"+rgb[0]+rgb[1]+rgb[2];
    }
  }, false);

  mousecanvas.addEventListener('mousemove', function(event) {
    if(browser.indexOf("IE") == -1||!mouseout){
      drawcursor(event);
      if (drawing == true) {
        if(brushstyle=='pen') drawLine(event,cs.style.backgroundColor);
        if(brushstyle=='eraser') drawLine(event,'white');
      }
    }
  }, false);

  mousecanvas.addEventListener('mouseup', function(event) {
    if (drawing == true) {
      if(brushstyle=='pen') drawLine(event,cs.style.backgroundColor);
      if(brushstyle=='eraser') drawLine(event,'white');
      drawing = false;
    }
  }, false);
    
  mousecanvas.addEventListener('mouseout', function(event) {
      mouseout=true;
    if (drawing == true) {
      positioning = position(event);
      if(brushstyle=='pen') drawLine(event,cs.style.backgroundColor);
      if(brushstyle=='eraser') drawLine(event,'white');
      //drawing = false;
    }
    ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
  }, false);
  
  mousecanvas.addEventListener('mouseover', function(event) {
      mouseout = false;
    if (drawing == true) {
        if(browser.indexOf("Chrome") != -1){
            if(Event.isLeftClick(event)){
                if(brushstyle=='pen') drawArc(event,cs.style.backgroundColor);
                if(brushstyle=='eraser') drawArc(event,'white');
            }else{
                drawing = false;
            }
        }else{
            drawing = false;
        }
    }
    ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
  }, false);
  
  ////////////////
  
  
  //画像保存
  //var save = document.getElementById('save');
  //save.addEventListener('click', function() {
  jQuery('#save').click(function(){
    var date = new Date();
      var points = {
          s: 'save'
        , id: canvas.id
        , rid: randomID
        , url: canvas.toDataURL()
        , time: yyyymmddhhmiss()
      };
      buffer(points);
    var url = canvas.toDataURL();
    window.open(url,'data url');
  });
  
  //クリア
  //var clear = document.getElementById('clear');
  //clear.addEventListener('click', function() {
  jQuery('#clear').click(function(){
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
  });
  
  //ログ表示
  //var log = document.getElementById('log');
  //log.addEventListener('click',function(){
  jQuery('#log').click(function(){
      window.open('/log/page1',null);
  });
  
  //ブラシサイズ選択
  jQuery('#brushsize').slider({
      value:8,
      min:1,
      max:40,
      change:function(event,ui){
          brushsize = ui.value/2;
      }
  });
  
  ////描画関数////
  
  var drawcursor = function(event){
        event.preventDefault();
        var positions = position(event);    
        if (brushstyle == 'pen') {
            ctxm.fillStyle = cs.style.backgroundColor;
            ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
            ctxm.beginPath();
            ctxm.arc(positions.x, positions.y, brushsize / 2, 0, Math.PI * 2, true);
            ctxm.fill();
        }
        else if (brushstyle == 'eraser'){
            ctxm.strokeStyle = 'black';
            ctxm.fillStyle = 'white';
            ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
            ctxm.beginPath();
            ctxm.arc(positions.x, positions.y, brushsize / 2, 0, Math.PI * 2, true);
            ctxm.stroke();
            ctxm.fill();
        }
        else if (brushstyle == 'gnh'){
            ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
            ctxm.drawImage(imgarr['gnh'],positions.x-imgarr['gnh'].width*(0.5+brushsize/10)/2,positions.y-imgarr['gnh'].height*(0.5+brushsize/10)/2,imgarr['gnh'].width*(0.5+brushsize/10),imgarr['gnh'].height*(0.5+brushsize/10));
        }
        else if (brushstyle == 'spuit'){
            
        }
  };
  
  function drawArc(event,color) {
    event.preventDefault();
    positioning = position(event);
    //var pressure = getPressure();    
    var points = {
        s: 'arc'
      , x: positioning.x
      , y: positioning.y
      , w: brushsize　/*pressure*/
      , c: color
      , id: canvas.id
      , rid: randomID
    }
    buffer(points);
    painting(points);
  }

  function drawLine(event,color) {
    event.preventDefault();    
    //var pressure = getPressure();    
    var positions = position(event);
    var points = {
        s: 'line'
      , x: positions.x
      , y: positions.y
      , xp: positioning.x
      , yp: positioning.y
      , w:  brushsize /*pressure*/
      , c: color
      , id: canvas.id
      , rid: randomID
    }
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
        context.drawImage(imgarr[points.img],points.x-imgarr['gnh'].width*(0.5+points.w/10)/2,points.y-imgarr['gnh'].height*(0.5+points.w/10)/2,imgarr['gnh'].width*(0.5+points.w/10),imgarr['gnh'].height*(0.5+points.w/10));
        break;
      case 'clear':
        clearing = true;
        context.fillStyle = "rgb(255,255,255)";
        context.fillRect(0,0,canvas.width,canvas.height);
        break;

      }
    }
  }
  
  ////送信系////
  
  function buffer(points){
      bufpts.push(points);
      
      if(points.s == 'clear'||points.s == 'save'){
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

function position(event) {//マウスの座標なおす
  var rect = event.target.getBoundingClientRect();
  return {
      x: event.clientX - rect.left
    , y: event.clientY - rect.top
  }
}

var toDoubleDigits = function(num) {//2ケタにする
  num += "";
  if (num.length === 1) {
    num = "0" + num;
  }
 return num;     
};

var toDoubleDigits16 = function(string) {//16進2ケタ
    if(string.length==1){
        string = "0" + string;
    }
    return string;
}

var yyyymmddhhmiss = function() {//日付取得整形
  var date = new Date();
  var yyyy = date.getFullYear();
  var mm = toDoubleDigits(date.getMonth() + 1);
  var dd = toDoubleDigits(date.getDate());
  var hh = toDoubleDigits(date.getHours());
  var mi = toDoubleDigits(date.getMinutes());
  var ss = toDoubleDigits(date.getSeconds());
  return yyyy + '-' + mm + '-' + dd + ' ' + hh + '.' + mi + '.' + ss;
};

//筆圧
/*
function getWacomPlugin() {
return window.Wacom || document.embeds["wacom-plugin"];
}

function getWacomPressure() {
var pressure = getWacomPlugin().pressure;
}

function getPressure() {
    //筆圧取得
    var plugin = getWacomPlugin();
    var pressure=1.0;
    //if(! typeof plugin === "undefined") pressure = plugin.pressure;
    if(plugin.pointerType==1) pressure = plugin.pressure;
    console.log('plugin:'+plugin);
    console.log('pluginisWacom:'+plugin.isWacom);
    console.log('plugin.pressure:'+plugin.pressure);
    console.log('pressure:'+pressure);
    console.log('TabletModel:'+plugin.TabletModel);
    console.log('pointertype:'+plugin.pointerType);
    console.log('type of plugin:'+ typeof plugin);
    
    return pressure;
}
*/