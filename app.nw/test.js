var express = require('express')
  , http = require('http')
  , fs = require('fs');
 
var app = express();
var server = app.listen(8080);
var io = require('socket.io').listen(server);

app.use('/static',express.static(__dirname + '/static'));

app.get("/", function (req, res) {
  var SubFrom = ['{{{host}}}'];
  var SubTo = [req.headers.host];
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data.toString().replace(SubFrom,SubTo));
  });
});

io.sockets.on('connection', function (socket) {
  socket.on('vibrate', function (data) {
    console.log(data);
  });
  socket.on('press', function (data) {
    console.log('press',data);
    socket.emit('vibrate');
  });
  socket.on('release', function (data) {
    console.log('release',data);
  });
});