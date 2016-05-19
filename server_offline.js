var childProcess = require('child_process')
  , express = require('express')
  , morgan = require('morgan')
  , ws = require('ws'),fs=require("fs");
var bodyParser = require('body-parser')
var Serial = require('serialport');
var SerialPort = Serial.SerialPort;
var serialPort;
var cam = require('linuxcam');
var bmp = require("bmp-js");
var gd = require("node-gd");

var RubiksCubeSolver = require("./lib/solver");
var frameWidth = 320;
var frameHeight = 240;
var path = "/home/pi/RubikCubeSolver";

// configuration files
var configServer = require('./lib/config/server');

console.log("READY");
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(bodyParser.json({limit: '256mb'}));
app.use(bodyParser.urlencoded({ limit:'256mb',extended: true }));
app.use(morgan('dev'));

// serve index
require('./lib/routes').serveIndex(app, configServer.staticFolder);

var commands = [];
var isMoving = false;
function nextCommand(){
  if(commands.length>0){
    isMoving = true;
    sendCommand( commands.shift());
    if(commands.length==0){    
       setTimeout(function(){
         sendCommand( "m4 t0");
         isMoving = false; 
         stateIndex = 0;
       }, 5000);
    }
  }else{
  }
}
app.post("/code",function(req,res){
    commands = req.body.code.split("\n");
    nextCommand();
    res.send("ok");
});
app.post("/move",function(req,res){
    serialPort.write( "m2 t"+req.body.turns+"\n");
    res.send("ok");
});
app.post("/rotate",function(req,res){
    serialPort.write( "m1 t"+req.body.turns+"\n");
    res.send("ok");
});
app.post("/flip",function(req,res){
    serialPort.write( "m3 t"+req.body.turns+"\n");
    res.send("ok");
});
app.post("/release",function(req,res){
    console.log(req.body.state);
    serialPort.write( "m5 t"+req.body.state+"\n");
    res.send("ok");
});
app.post("/enable",function(req,res){
    serialPort.write( "m4 t"+req.body.state+"\n");
    res.send("ok");
});
var  _buffers = "";
fs.access('/dev/video0',function(err){
    if(err==null){
        cam.start("/dev/video0", frameWidth, frameHeight);
    }else{
        cam.start("/dev/video1", frameWidth, frameHeight);
    }
});
function startSolver(){
   if(!isMoving){
      fs.access('/dev/video0',function(err){
          if(err==null){
              childProcess.exec(path+'/bin/do_camera.sh 0');
          }else{
              childProcess.exec(path+'/bin/do_camera.sh 1');
          }
      });
      sendCommand( "m4 t1");
      sendCommand( "m4 t1");
      stateIndex = 0; 
      cubesResult = "";
      faceIndex = 0;
      isMoving = true;
      setTimeout(getCubeState,500);
  }
  _buffers = "";
}
function connectSerial(port){
    serialPort = new SerialPort(port, {baudrate: 115200});
    serialPort.on('open', function () {
      console.log('serial opened!');
      serialPort.on('data', function (data) {
        for(var i=0;i<data.length;i++){
            if(data[i]>0){
    console.log(data[i]);
              _buffers += data[i].toString().toLowerCase();
            }
        }
        if(_buffers.indexOf('ok')>-1){
            nextCommand();
            _buffers = "";
        }
        if(_buffers.indexOf('start')>-1){
           startSolver();
        }
      });
    });
    serialPort.on('close', function () {
      console.log('close');
    })
}
app.post('/connect',(req,res) => {
    connectSerial(req.body.data);
    res.send('ok');
});
app.post('/list',(req,res) => {
 Serial.list(function (err, ports) {
    var result = "";
    ports.forEach(function(port) {
       result+=port.comName+",";
    });
    res.send(result.substr(0,result.length-1));
});   
});
app.post('/disconnect',(req,res) => {
    if(serialPort){
        serialPort.close();
    }
    serialPort = null;
    res.send('ok');
});
function update(socket) {
  var frame = cam.frame();
    var rgba = [];
    for(var i=0;i<frame.height;i++){
        for(var j=0;j<frame.width;j++){
            rgba.push(frame.data[(i*frame.width+j)*3]);
            rgba.push(frame.data[(i*frame.width+j)*3+1]);
            rgba.push(frame.data[(i*frame.width+j)*3+2]);
            rgba.push(255);
        }
    }
  var rawData = bmp.encode({data:rgba,width:frame.width,height:frame.height});
  socket.emit("frame", rawData.data.toString('base64'));
  setTimeout(function() {
    update(socket);
  }, 40);
}
 
io.on('connection', function(socket){
  socket.on('error', function(err){
    console.log("ERROR: "+err);
  });
  update(socket);
});
 
// HTTP server
http.listen(app.get('port'), function () {
  console.log('HTTP server listening on port ' + app.get('port'));
});
function sendCommand(cmd){
    try{
        console.log(cmd);
        serialPort.write(cmd+"\n");
    }catch(err){
        console.log(err);
    }
}
function releaseCube(state){
   sendCommand( "m5 t"+state);
}
function flipCube(turns){
   sendCommand( "m3 t"+turns);
}
function rotationCube(turns){
   sendCommand( "m1 t"+turns);
}
function moveCube(turns){
   sendCommand( "m2 t"+turns);
}
var commandsAction = {};
commandsAction["U"]="m3 t2\nm2 t-1\nm3 t2\n";
commandsAction["U'"]="m3 t2\nm2 t1\nm3 t2\n";
commandsAction["F"]="m3 t1\nm2 t-1\nm3 t3\n";
commandsAction["F'"]="m3 t1\nm2 t1\nm3 t3\n";
commandsAction["D"]="m2 t-1\n";
commandsAction["D'"]="m2 t1\n";
commandsAction["B"]="m3 t3\nm2 t-1\nm3 t1\n";
commandsAction["B'"]="m3 t3\nm2 t1\nm3 t1\n";
commandsAction["L"]="m1 t1\nm3 t3\nm2 t-1\nm3 t1\nm1 t-1\n";
commandsAction["L'"]="m1 t1\nm3 t3\nm2 t1\nm3 t1\nm1 t-1\n";
commandsAction["R"]="m1 t-1\nm3 t3\nm2 t-1\nm3 t1\nm1 t1\n";
commandsAction["R'"]="m1 t-1\nm3 t3\nm2 t1\nm3 t1\nm1 t1\n";
commandsAction["U2"]="m3 t2\nm2 t-2\nm3 t2\n";
commandsAction["F2"]="m3 t1\nm2 t-2\nm3 t3\n";
commandsAction["D2"]="m2 t-2\n";
commandsAction["B2"]="m3 t3\nm2 t-2\nm3 t1\n";
commandsAction["L2"]="m1 t1\nm3 t3\nm2 t-2\nm3 t1\nm1 t-1\n";
commandsAction["R2"]="m1 t-1\nm3 t3\nm2 t-2\nm3 t1\nm1 t1\n";
var cubesResult = "";
var logResult = "";
var faceIndex = 0;
var stateIndex = 0;
var faceColors = [];
var faceNames = ["U","B","D","F","L","R"];
var faces = {U:0,B:1,D:2,F:3,L:4,R:5};
console.log("starting!!!!");
function getCubeState(){
    var delay = 1500;
    stateIndex++;
    if(stateIndex<22){
        if(stateIndex==1){
            releaseCube(0);
        }else if(stateIndex==2){
            captureCube();
            delay=100;
        }else if(stateIndex==3){
            flipCube(1);
        }else if(stateIndex==4){
            captureCube();
            delay=100;
        }else if(stateIndex==5){
            flipCube(1);
        }else if(stateIndex==6){
            captureCube();
            delay=100;
        }else if(stateIndex==7){
            flipCube(1);
        }else if(stateIndex==8){
            captureCube();
            delay=100;
        }else if(stateIndex==9){
            rotationCube(1);
            delay=1000;
        }else if(stateIndex==10){
            flipCube(1);
            delay=4000;
        }else if(stateIndex==11){
            captureCube();
            delay=100;
        }else if(stateIndex==12){
            flipCube(1);
            delay=2000;
        }else if(stateIndex==13){
            flipCube(1);
            delay=2000;
        }else if(stateIndex==14){
            rotationCube(1);
            delay=500;
        }else if(stateIndex==15){
            rotationCube(1);
            delay=500;
        }else if(stateIndex==16){
            releaseCube(0);
        }else if(stateIndex==17){
            captureCube();
            delay=100;
        }else if(stateIndex==18){
            rotationCube(1);
            delay=2000;
        }else if(stateIndex==19){
            flipCube(1);
            delay=2000;
        }else if(stateIndex==20){
            rotationCube(-1);
            delay=500;
        }else if(stateIndex==21){
            releaseCube(0);
            delay=1000;
        }
        setTimeout(getCubeState,delay);
    }
}

function captureCube(){
    var debug = true;
    for(var i=0;i<60;i++){
        cam.frame();
    }
    var imageFrame = cam.frame();
    var pixels = imageFrame.data;
    var rgba = new Buffer(frameWidth*frameHeight*4);
    for(var i=0;i<imageFrame.height;i++){
        for(var j=0;j<imageFrame.width;j++){
            rgba[(i*imageFrame.width+j)*4]=(pixels[(i*imageFrame.width+j)*3]);
            rgba[(i*imageFrame.width+j)*4+1]=(pixels[(i*imageFrame.width+j)*3+1]);
            rgba[(i*imageFrame.width+j)*4+2]=(pixels[(i*imageFrame.width+j)*3+2]);
            rgba[(i*imageFrame.width+j)*4+3]=(255);
        }
    }
   var rawData = bmp.encode({data:rgba,width:imageFrame.width,height:imageFrame.height});
    //console.log(faceIndex);
    if(debug){
        gd.createFromBmpPtr(rawData.data).saveJpeg(path+"/faces/"+(faceIndex+1)+".jpg",function(err){
        //console.log(err);
        });
    }
    var sx = 100;
    var sy = 54;
    var dw = 64;
    var rw = 6;
    var len = rw*rw;
    var row = "";
    for(var i=0;i<3;i++){
        for(var j=0;j<3;j++){
            var _rgb = [0,0,0];
        	for(var k=0;k<rw;k++){
                for(var l=0;l<rw;l++){
                    var rgb = getPixel(sx+j*dw+k,sy+i*dw+l,pixels);
                    _rgb[0]+=rgb[0];
                    _rgb[1]+=rgb[1];
                    _rgb[2]+=rgb[2];
                }
            }
            var r = _rgb[0]/len;
            var g = _rgb[1]/len;
            var b = _rgb[2]/len;
            var cc = checkColor(r,g,b,debug);
            if(i==1&&j==1){
                faceColors[faceIndex]=cc[0];
            }
           cubesResult+=(cc[0]+"");
            row+=cc[0]+" ";
        }
            row+="\n";
    }
    logResult += row;
    faceIndex++;
    if(faceIndex>=6){
        console.log(cubesResult);
        for(var ci=0;ci<6;ci++){
          cubesResult = cubesResult.split(faceColors[ci]).join(faceNames[ci ]);
        }
        var cubes = cubesResult.split("");
        var states = [];
        states.push(getFaceCube(cubes,"U",7)+getFaceCube(cubes,"F",1));
        states.push(getFaceCube(cubes,"U",5)+getFaceCube(cubes,"R",3));
        states.push(getFaceCube(cubes,"U",1)+getFaceCube(cubes,"B",7));
        states.push(getFaceCube(cubes,"U",3)+getFaceCube(cubes,"L",5));
        states.push(getFaceCube(cubes,"D",1)+getFaceCube(cubes,"F",7));
        states.push(getFaceCube(cubes,"D",5)+getFaceCube(cubes,"R",5));
        states.push(getFaceCube(cubes,"D",7)+getFaceCube(cubes,"B",1));
        states.push(getFaceCube(cubes,"D",3)+getFaceCube(cubes,"L",3));
        states.push(getFaceCube(cubes,"F",5)+getFaceCube(cubes,"R",7));
        states.push(getFaceCube(cubes,"F",3)+getFaceCube(cubes,"L",7));
        states.push(getFaceCube(cubes,"B",5)+getFaceCube(cubes,"R",1));
        states.push(getFaceCube(cubes,"B",3)+getFaceCube(cubes,"L",1));
        states.push(getFaceCube(cubes,"U",8)+getFaceCube(cubes,"F",2)+getFaceCube(cubes,"R",6));
        states.push(getFaceCube(cubes,"U",2)+getFaceCube(cubes,"R",0)+getFaceCube(cubes,"B",8));
        states.push(getFaceCube(cubes,"U",0)+getFaceCube(cubes,"B",6)+getFaceCube(cubes,"L",2));
        states.push(getFaceCube(cubes,"U",6)+getFaceCube(cubes,"L",8)+getFaceCube(cubes,"F",0));
        states.push(getFaceCube(cubes,"D",2)+getFaceCube(cubes,"R",8)+getFaceCube(cubes,"F",8));
        states.push(getFaceCube(cubes,"D",0)+getFaceCube(cubes,"F",6)+getFaceCube(cubes,"L",6));
        states.push(getFaceCube(cubes,"D",6)+getFaceCube(cubes,"L",0)+getFaceCube(cubes,"B",0));
        states.push(getFaceCube(cubes,"D",8)+getFaceCube(cubes,"B",2)+getFaceCube(cubes,"R",2));
        console.log(states.join(" "));
        var solver = new RubiksCubeSolver();
        solver.setState(states.join(" "));
        var output = solver.solve();
        if(output!=false){
            var list = output.split(" ");
            var codes = "";
            for(var i=0;i<list.length;i++){
                codes+=commandsAction[list[i]];
            }
            codes = codes.substr(0,codes.length-1);
             console.log("starting solve");     
            setTimeout(function(){
                fs.open(path+"/log.txt","w",function(err,fd){
                    var buf = new Buffer(output);
                    fs.writeSync(fd,buf,0,buf.length,0);
                    logResult = "";
                });
            }, 100);
            setTimeout(function(){
                commands = codes.split("\n");       
                nextCommand();
            }, 5000);
        }else{
            console.log("solve fail!!!!");            
            setTimeout(function(){
                fs.open(path+"/log.txt","w",function(err,fd){
                    var buf = new Buffer(logResult);
                    fs.writeSync(fd,buf,0,buf.length,0);
                    logResult = "";
                });
                sendCommand( "m4 t0");
                isMoving = false;
            }, 5000);
        }
        
        cubesResult = "";
        faceIndex = 0;
    }
}
function checkColor(r,g,b,debug){
    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);
    var c_max = Math.max(r,Math.max(g,b));
    var c_min = Math.min(r,Math.min(g,b));
    r = Math.floor(r-c_min);
    g = Math.floor(g-c_min);
    b = Math.floor(b-c_min);
    if(debug){
          logResult+=r+":"+g+":"+b+"\n";
     }
     if(Math.abs(r-g)<20&&b<50&&r>100){
        return ["y","D"];//"yellow";            
    }else if(r<50&&((b>100&&g<100)||(g>100&&b>g+50))){
        return ["b","F"];//"blue";
    }else if(r<30&&g<30&&b<30){
        return ["w","U"];//"white";
    }else if((r>120&&g<200&&g-b>40)){
        return ["o","R"];//"orange";
    }else if(r>130&&g<40&&b<40){
        return ["r","L"];//"red";
    }else if(r<50&&g>100){
        return ["g","B"];//"green";
    }else{
        return ["o","R"];
    }
}
function getPixel(x,y,pixels){
    var i = (y*frameWidth+x)*3;
    return [pixels[i],pixels[i+1],pixels[i+2]];
}
function getFaceCube(data,face,index){
    return data[faces[face]*9+index];
}
setTimeout(function(){
        connectSerial('/dev/ttyS0');
},2000);
module.exports.app = app;
