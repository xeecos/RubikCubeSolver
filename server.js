var express = require('express')
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var cam = require("linuxcam");
var jpeg = require('jpeg-js');

cam.start('/dev/video0',320,240);
function update(socket) {
  var frame = cam.frame();
  var rawImageData = {
  data: frame.data,
  width: frame.width,
  height: frame.height
};
  var jpegFrame = jpeg.encode(rawImageData,80);
console.log(frame.data.length,jpegFrame.data.length);
  socket.emit("frame", jpegFrame.data.toString('base64'));
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
 app.use(express.static('public'));
http.listen(9639, function(){
  console.log('listening on *:9639');
});
