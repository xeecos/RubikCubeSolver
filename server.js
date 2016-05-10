var childProcess = require('child_process')
  , express = require('express')
  , http = require('http')
  , morgan = require('morgan')
  , ws = require('ws');
var bodyParser = require('body-parser')
var Serial = require('serialport');
var SerialPort = Serial.SerialPort;
var serialPort;

// configuration files
var configServer = require('./lib/config/server');

console.log("READY");

var app = express();
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(bodyParser.json({limit: '256mb'}));
app.use(bodyParser.urlencoded({ limit:'256mb',extended: true }));
app.use(morgan('dev'));


// serve index
require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
http.createServer(app).listen(app.get('port'), function () {
  console.log('HTTP server listening on port ' + app.get('port'));
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
app.post('/connect',(req,res) => {
    serialPort = new SerialPort(req.body.data, {baudrate: 115200});
    serialPort.on('open', function () {
      console.log('serial opened!');
       serialPort.write( "m4 t1\n");
      serialPort.on('data', function (data) {
        _buffers += data.toString().toLowerCase();
        if(_buffers.indexOf('ok')>-1){
            _buffers = "";
        }
      });
    });
    serialPort.on('close', function () {
      console.log('close');
    })
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
var STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes
var width = 640;
var height = 480;

// WebSocket server
var wsServer = new (ws.Server)({ port: configServer.wsPort });
console.log('WebSocket server listening on port ' + configServer.wsPort);

wsServer.on('connection', function(socket) {
  // Send magic bytes and video size to the newly connected socket
  // struct { char magic[4]; unsigned short width, height;}
  var streamHeader = new Buffer(8);

  streamHeader.write(STREAM_MAGIC_BYTES);
  streamHeader.writeUInt16BE(width, 4);
  streamHeader.writeUInt16BE(height, 6);
  socket.send(streamHeader, { binary: true });

  console.log('New WebSocket Connection (' + wsServer.clients.length + ' total)');

  socket.on('close', function(code, message){
    console.log('Disconnected WebSocket (' + wsServer.clients.length + ' total)');
  });
});

wsServer.broadcast = function(data, opts) {
  for(var i in this.clients) {
    if(this.clients[i].readyState == 1) {
      this.clients[i].send(data, opts);
    }
    else {
      console.log('Error: Client (' + i + ') not connected.');
    }
  }
};
function resetStream(){
  childProcess.exec('./bin/do_ffmpeg.sh');
};
// HTTP server to accept incoming MPEG1 stream
var server = http.createServer(function (req, res) {
  console.log(
    'Stream Connected: ' + req.socket.remoteAddress +
    ':' + req.socket.remotePort + ' size: ' + width + 'x' + height
  );

  req.on('data', function (data) {
    wsServer.broadcast(data, { binary: true });
  });
});
server.listen(configServer.streamPort, function () {
  console.log('Listening for video stream on port ' + configServer.streamPort);

  // Run do_ffmpeg.sh from node                                                   
  childProcess.exec('./bin/do_ffmpeg.sh');
});
server.timeout = 0;
module.exports.app = app;
