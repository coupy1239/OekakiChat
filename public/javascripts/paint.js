jQuery(document).ready(function(){
  
  jQuery.noConflict()
  
    ////変数////
  
  var bufpts = new Array();  
  var brushsize = 4;  
  var mycolor = '#000000';
  var brushstyle = 'pen';
  var positioning = null;
  var positioned = null;
  var drawing = false;
  var selecting = false;
  var buffering = false;
  var clearing = false;
  var mouseout = false;
  var shiftdown = false;
  var focused = false;
  
  ////////////
  
  ////いろんなもの読み込む////
  
  var browser = navigator.userAgent;//ブラウザ
  
  var paint = new io.connect('/paint');//ソケット
  paint.on('paint points', function(data) {
        for(var i in data) painting(data[i]);
  });
  
  var imgarr = [];//スタンプ画像
  imgarr = {'gnh':new Image()};
  imgarr['gnh'].src = '/img/hibiki.png';
  
  var stampcanvas = jQuery('#p0')[0];//スタンプ用キャンバス
  var ctxs = stampcanvas.getContext('2d');
  
  var canvas = jQuery('#p1')[0];//描画キャンバス
  var context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.fillRect(0,0,canvas.width,canvas.height);
  context.lineWidth = 4;
  context.lineCap = 'round';
  context.fillStyle = 'black';
  context.strokeStyle = 'black';
  
  var mousecanvas = jQuery('#p2')[0];//カーソル用キャンバス
  var ctxm = mousecanvas.getContext('2d');
  ctxm.lineCap ='round';
  
  var cs = jQuery('#cs')[0]; //色選択
  jQuery('#cs').ColorPicker({
        color:'#000000', 
        onChange: function (hsb, hex, rgb) {
            jQuery('#cs').css('backgroundColor', '#' + hex);
            jQuery('#cs').val('#' + hex);
            if(hsb.b<80) jQuery('#cs').css('color','#ffffff');
            else jQuery('#cs').css('color','#000000');                    
        }
  });
  
  var bs= jQuery('#brushgroup')[0];//ブラシ選択
  bs.onchange = function(event){
      brushstyle = jQuery("#brushgroup input[name='bg']:checked").val();
  };
  
  ////////////
  

  
    
  ////マウスイベント////
  
  //mousecanvas.addEventListener('mousedown', function(event) {
  mousecanvas.onmousedown = function(event){
    drawing = true;
    if(brushstyle=='pen'){
        if(shiftdown) drawLine(event,cs.style.backgroundColor);
        else drawArc(event,cs.style.backgroundColor);
    }
    if(brushstyle=='eraser'){
        if(shiftdown) drawLine(event,'white');
        else drawArc(event,'white');
    }
    if(brushstyle=='gnh'){
         drawStamp(event,brushstyle,cs.style.backgroundColor);
    } 
    if(brushstyle=='spuit'){
        var imgdata = context.createImageData(1,1);
        event.preventDefault();
        positioning = position(event);
        imgdata = context.getImageData(positioning.x,positioning.y,1,1);
        /*
        cs.style.backgroundColor = "rgb("+imgdata.data[0].toString()+','+imgdata.data[1].toString()+','+imgdata.data[2].toString()+')';
        var rgb = new Array();
        for(var i=0;i<3;i++) rgb[i]=toDoubleDigits16(imgdata.data[i].toString(16));
        cs.value = "#"+rgb[0]+rgb[1]+rgb[2];
        if((imgdata.data[0]+imgdata.data[1]+imgdata.data[2])/3<128) cs.style.color = "#FFFFFF";
        else cs.style.color = "#000000";
        */
        var hex ='';
        for(var i=0;i<3;i++) hex += toDoubleDigits16(imgdata.data[i].toString(16));
        jQuery('#cs').ColorPickerSetColor('#' + hex);
        jQuery('#cs').css('backgroundColor', '#' + hex);
        jQuery('#cs').val('#' + hex);
        if(jQuery('.colorpicker_hsb_b').children('input')[0].value<80) jQuery('#cs').css('color','#ffffff');
        else jQuery('#cs').css('color','#000000');   
    }
  };

  mousecanvas.onmousemove = function(event){
    if(browser.indexOf("IE") == -1||!mouseout){
      positioned = position(event);
      drawcursor(event);
      if (drawing == true) {
        if(brushstyle=='pen') drawLine(event,cs.style.backgroundColor);
        if(brushstyle=='eraser') drawLine(event,'white');
      }
    }
  };

  mousecanvas.onmouseup = function(event){
    if (drawing == true) {
      if(brushstyle=='pen') {
          drawLine(event,cs.style.backgroundColor);
      }
      if(brushstyle=='eraser') drawLine(event,'white');
      drawing = false;
    }
  };
    
  mousecanvas.onmouseout = function(event){
      mouseout=true;
    if (drawing == true) {
      positioning = position(event);
      if(brushstyle=='pen') drawLine(event,cs.style.backgroundColor);
      if(brushstyle=='eraser') drawLine(event,'white');
    }
    ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
  };
  
  mousecanvas.onmouseover = function(event){
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
  };
  
  document.onkeydown = function(event){
    if(event.shiftKey){
        if((!shiftdown)&&positioning) drawShiftLine();
    }
    shiftdown = event.shiftKey;
    keydown(event.keyCode);
  };
  
  document.onkeyup = function(event){
    if(shiftdown&&positioning) ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height);
    shiftdown = event.shiftKey;    
    keyup(event.keyCode);
  };

  ////////////////
  
  
  //画像保存
  //var save = document.getElementById('save');
  //save.addEventListener('click', function() {
  jQuery('#save').click(function(){
    var date = new Date();
      var points = {
          s: 'save'
        //, id: canvas.id
        //, rid: randomID
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
        //, rid: randomID
        , url: canvas.toDataURL()
        , time: yyyymmddhhmiss()
      };
      buffer(points);
      painting(points);
    }
  });
  
  //ログ表示
  //var log = document.getElementById('log');
  //log.addEventListener('click',function(){
  jQuery('#log').click(function(){
      window.open('/log/page1.html',null);
  });
  
  //ブラシサイズ選択
  jQuery('#brushsize').slider({
      value:8,
      min:2,
      max:40,
      change:function(event,ui){
          brushsize = Math.floor(ui.value/2);
      }
  });
  
  ////描画関数////
  
  var drawcursor = function(event){
        event.preventDefault();
        var positions = position(event);
        ctxm.clearRect(0, 0, mousecanvas.width, mousecanvas.height); 
        if (brushstyle == 'pen') {
            ctxm.fillStyle = cs.style.backgroundColor;            
            ctxm.beginPath();
            ctxm.arc(positions.x, positions.y, brushsize / 2, 0, Math.PI * 2, true);
            ctxm.fill();
            
            //直線表示
            if(shiftdown) drawShiftLine();
            
        }
        else if (brushstyle == 'eraser'){
            ctxm.lineWidth = 1;
            ctxm.strokeStyle = 'black';
            ctxm.fillStyle = 'white';
            ctxm.beginPath();
            ctxm.arc(positions.x, positions.y, brushsize / 2, 0, Math.PI * 2, true);
            ctxm.stroke();
            ctxm.fill();
            
            //直線表示
            if(shiftdown) drawShiftLine();
            
        }                
        else if (brushstyle == 'gnh') {
            //ctxm.drawImage(imgarr['gnh'],positions.x-imgarr['gnh'].width*(0.5+brushsize/10)/2,positions.y-imgarr['gnh'].height*(0.5+brushsize/10)/2,imgarr['gnh'].width*(0.5+brushsize/10),imgarr['gnh'].height*(0.5+brushsize/10));
        
            ctxm.fillStyle = cs.style.backgroundColor;
            var stampSize = {
                x : imgarr['gnh'].width * (0.5 + brushsize / 10),
                y : imgarr['gnh'].height * (0.5 + brushsize / 10)
            };
            var stampPosition = {
                x : positions.x - stampSize.x / 2,
                y : positions.y - stampSize.y / 2
            };
            ctxs.clearRect(0, 0, stampcanvas.width, stampcanvas.height);
            ctxs.drawImage(imgarr['gnh'], stampPosition.x, stampPosition.y, stampSize.x, stampSize.y);//スタンプ用キャンバスに描画
        
            var stampData = ctxs.createImageData(stampSize.x, stampSize.y);
            stampData = ctxs.getImageData(stampPosition.x, stampPosition.y, stampSize.x, stampSize.y);

            var stamp_r = parseInt(ctxm.fillStyle.substring(1, 3), 16);
            var stamp_g = parseInt(ctxm.fillStyle.substring(3, 5), 16);
            var stamp_b = parseInt(ctxm.fillStyle.substring(5, 7), 16);
            for (i in stampData.data) {
                if (i % 4 == 3 && stampData.data[i] > 0) {
                    stampData.data[i - 3] = stamp_r;
                    stampData.data[i - 2] = stamp_g;
                    stampData.data[i - 1] = stamp_b;
                }
            }
            ctxm.putImageData(stampData, stampPosition.x, stampPosition.y);
        }
        else if (brushstyle == 'spuit'){
            
        }
  };
  
  function drawShiftLine(){
      if(positioning){
          if (brushstyle == 'pen'||brushstyle == 'eraser'){
            ctxm.lineWidth = brushsize;
            if(brushstyle == 'pen') ctxm.strokeStyle = cs.style.backgroundColor;
            else if(brushstyle == 'eraser') ctxm.strokeStyle = 'white';     
            ctxm.beginPath();
            ctxm.moveTo(positioned.x, positioned.y);   
            ctxm.lineTo(positioning.x, positioning.y);
            ctxm.stroke();
          }
      }
  }
  
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
      //, id: canvas.id
      //, rid: randomID
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
      //, id: canvas.id
      //, rid: randomID
    }
    buffer(points)
    painting({
        s: points.s
      , x: [points.xp ,points.x]
      , y: [points.yp ,points.y]
      , w:  points.w
      , c: points.c
      //, id: points.id
      //, rid: points.rid
    });
    positioning = positions;
  }
  
  function drawStamp(event,img,color){
        event.preventDefault();
        positioning = position(event);
        var points = {
        s: 'stamp'
      , x: positioning.x
      , y: positioning.y
      , w: brushsize
      , c: color
      //, id: canvas.id
      //, rid: randomID
      , img: img
        }
        buffer(points);
        painting(points);
  }

  function painting(points) {
    clearing = false;
    //if (canvas.id == points.id) {      
      switch (points.s) {
      case 'line':
        context.lineWidth = points.w;
        context.strokeStyle = points.c;
        var kisuu_hosei = 0.5*points.w%2;//奇数なら座標0.5マイナス
        /*          
        context.beginPath();        
        context.moveTo(points.x[0]-kisuu_hosei, points.y[0]-kisuu_hosei);
        for(var i=1;i<points.x.length;i++) context.lineTo(points.x[i]-kisuu_hosei, points.y[i]-kisuu_hosei);
        context.stroke();
        */
        
        for(var i=1;i<points.x.length;i++){
            context.beginPath();
            context.moveTo(points.x[i-1]-kisuu_hosei, points.y[i-1]-kisuu_hosei);
            context.lineTo(points.x[i]-kisuu_hosei, points.y[i]-kisuu_hosei);
            context.stroke();
        }
        break;
      case 'arc':
        context.fillStyle = points.c;
        context.beginPath();
        context.arc(points.x, points.y, Math.floor(points.w/2), 0, Math.PI*2, true);
        context.fill();
        break;
      case 'stamp':
        //旧スタンプ
        //context.drawImage(imgarr[points.img],points.x-imgarr['gnh'].width*(0.5+points.w/10)/2,points.y-imgarr['gnh'].height*(0.5+points.w/10)/2,imgarr['gnh'].width*(0.5+points.w/10),imgarr['gnh'].height*(0.5+points.w/10));
        
        //新スタンプ        
        context.fillStyle = points.c;
        var stampSize = {x:imgarr[points.img].width*(0.5+points.w/10),y:imgarr[points.img].height*(0.5+points.w/10)};
        var stampPosition = {x:points.x-stampSize.x/2,y:points.y-stampSize.y/2};
        ctxs.clearRect(0, 0, stampcanvas.width, stampcanvas.height);
        ctxs.drawImage(imgarr[points.img],stampPosition.x,stampPosition.y,stampSize.x,stampSize.y);//スタンプ用キャンバスに描画
        
        var stampData =ctxs.createImageData(stampSize.x,stampSize.y);
        stampData = ctxs.getImageData(stampPosition.x,stampPosition.y,stampSize.x,stampSize.y);
        var canvasData = context.createImageData(stampSize.x,stampSize.y);
        canvasData = context.getImageData(stampPosition.x,stampPosition.y,stampSize.x,stampSize.y);
        
        var stamp_r = parseInt(context.fillStyle.substring(1,3),16);
        var stamp_g = parseInt(context.fillStyle.substring(3,5),16);
        var stamp_b = parseInt(context.fillStyle.substring(5,7),16);
        for(i in stampData.data){
            if(i%4 == 3 && stampData.data[i]>0){
                var alpha = stampData.data[i]/255;
                canvasData.data[i-3] = stamp_r*alpha + canvasData.data[i-3]*(1-alpha);
                canvasData.data[i-2] = stamp_g*alpha + canvasData.data[i-2]*(1-alpha);
                canvasData.data[i-1] = stamp_b*alpha + canvasData.data[i-1]*(1-alpha);
            }
        }
        context.putImageData(canvasData,stampPosition.x,stampPosition.y);        
        break;
      case 'clear':
        clearing = true;
        context.fillStyle = "white";
        context.fillRect(0,0,canvas.width,canvas.height);
        break;

      }
    //}
  }
  
  ////送信系////
  
  function buffer(points){
      //まとめる              
        if (points.s == 'line') {
            var linepoints = {
                    s : points.s,
                    x : [points.xp, points.x],
                    y : [points.yp, points.y],
                    w : points.w,
                    c : points.c,
                    //id : points.id,
                    //rid : points.rid
            };
            
            if (bufpts.length > 0) {
                if (bufpts.slice(-1)[0].s == points.s && bufpts.slice(-1)[0].c == points.c && bufpts.slice(-1)[0].w == points.w && bufpts.slice(-1)[0].s == 'line') {
                    bufpts[bufpts.length-1].x.push(points.x);
                    bufpts[bufpts.length-1].y.push(points.y);
                }else{
                    bufpts.push(linepoints);
                }
            } else {
                bufpts.push(linepoints);
            }
        }else{
            bufpts.push(points);
      }
      
      //クリアセーブは即送信・他は0.5秒ごとに送信
      if(points.s == 'clear'||points.s == 'save'){
          buffering = true;
          emitting();
      }else if(!buffering){
          buffering = true;
          setTimeout(function(){emitting()},500);
      }
  }
  function emitting(){
      if(buffering){
          paint.json.emit('paint points', bufpts);
          bufpts = [];
          buffering = false;
      }
  }
  
  ////////////////////////////////////////////////////
  /////////////////////////////chara///////////////
  ////////////////////////////////////////////////////
    var charaon = true;
    /*jQuery('#switch1')[0].onchange = function(){
        alert(jQuery('#switch1').prop('checked'));
    };*/
  
    paint.on('chara move',function(data){//move受信
      var exist = false;
      if(charaarray.length>0){
          for(var i=0;i<charaarray.length;i++){
              if(charaarray[i].id == data.id){
                  charaarray[i].x = data.x;
                  charaarray[i].y = data.y;
                  exist = true;
                  break;
              }          
          }
      }
      if(!exist){//新規だった
          newchara = new Charactor(data.id,data.x,data.y);
          charaarray.push(newchara);
          chara_emitting({id:mychara.id,x:mychara.x,y:mychara.y});
      }
    });
    
    paint.on('chara disconnect',function(data){//切断
        for(var i=0;i<charaarray.length;i++){
              if(charaarray[i].id == data.id){
                  charaarray.splice(i,1);
                  break;
              }          
        }
    });
    
    
    var mychara;
    var charaarray = new Array();
    var rightpressed=false;
    var leftpressed=false;
    var ground = 200;
    var FPS = 10;
    
    var cv_chara = jQuery('#p3')[0];//キャラ描画キャンバス
    var cx_chara = cv_chara.getContext('2d');
    
    function Charactor(id,x,y){
        this.id = id;
        this.x = x;
        this.y = y;
        this.x_prev = x;
        this.y_prev = y;
        this.vx = 0;
        this.vy = 0;
        this.gv = 4;
        this.ar = 1.001;
        
        this.xspeed = 18;
        this.yspeed = 30;
        
        this.jumping = false;
        
        this.jump = function(){
          if(!this.jumping){
              this.jumping = true;
              this.vy  = -this.yspeed;
          }  
        };
        
        this.move = function(){
            this.x_prev = this.x;
            this.y_prev = this.y;
            
            //移動処理
            //x
            if(!this.jumping){
                if(rightpressed) this.vx = this.xspeed;
                else if(leftpressed) this.vx = -this.xspeed;
                else this.vx = 0;
            }else{
                this.vx = parseInt(this.vx / this.ar);
            }
            this.x += this.vx;
            //y
            if(this.jumping){
                this.vy += this.gv;
                if(this.vy>this.yspeed/2) this.vy = this.yspeed/2;
                this.y += this.vy;
                if(this.y>ground){
                    this.y = ground;
                    this.jumping = false;
                }
            }
            //移動したか
            if(this.isMoving()) chara_emitting({id:this.id,x:this.x,y:this.y});
        };
        
        this.draw = function(){
            cx_chara.drawImage(imgarr['gnh'],this.x,this.y);
        };
        
        this.isMoving = function(){
            if(this.x != this.x_prev||this.y != this.y_prev) return true;
            else return false;
        };
       
    }
    
    //操作関数
    function keyup(code){
        switch(code){
            case(37):leftpressed = false; break;//左
            case(38):break;//上
            case(39):rightpressed = false; break;//右
            case(40):break;//下
        }
    }
    
    function keydown(code){
        console.log('keydown!');
        switch(code){
            case(37):leftpressed = true; break;//左
            case(38):break;//上
            case(39):rightpressed =true; break;//右
            case(40):break;//下
            case(32):mychara.jump();break;//スペース
        }
    }
    
    function chara_emitting(moving){//送信
        if(jQuery('#switch1').prop('checked')) paint.json.emit('chara move', moving);
    }
    
    
    //
    var run = function(){
        setInterval(function(){
            cx_chara.clearRect(0, 0, cv_chara.width, cv_chara.height);//ちゃんと考えて
            if(jQuery('#switch1').prop('checked')){
                mychara.move();
                mychara.draw();
                if(charaarray.length>0){
                    for(var i=0;i<charaarray.length;i++){
                        charaarray[i].draw();
                    }
                }
            }
        },1000/FPS);
    }
    
    //初期化
    mychara = new Charactor(Math.random(),200,200);
    chara_emitting({id:mychara.id,x:mychara.x,y:mychara.y});
    run();
  ////////////////////////////////////////////////////
  ////////////////////////////////////////////////////
  ////////////////////////////////////////////////////
  
}, false);

function position(event) {//マウスの座標なおす
  var rect = event.target.getBoundingClientRect();
  return {
      x: Math.floor(event.clientX - rect.left)
    , y: Math.floor(event.clientY - rect.top)
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