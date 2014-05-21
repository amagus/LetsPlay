var express = require('express')
  , http = require('http')
  , fs = require('fs')
  , edge = require('edge');
  
var __MAX_PLAYERS = 4;
var __TIMEOUT = 5000;
 
function myservices($scope){
	
	var app = express();
	var server = app.listen(9090);
	var io = require('socket.io').listen(server,{log: false});
	
	app.use('/static',express.static(process.cwd() + '/static'));
	
	app.get("/", function (req, res) {
	  var SubFrom = ['{{{host}}}',"{{{timeout}}}"];
	  var SubTo = [req.headers.host,__TIMEOUT];
	  fs.readFile(process.cwd() + '/index_express.html',
	  function (err, data) {
	    if (err) {
	      res.writeHead(500);
	      return res.end('Error loading index.html');
	    }
	
	    res.writeHead(200);
	    data = data.toString();
	    for(var i = 0; i < SubFrom.length; i++){
		   data = data.replace(SubFrom[i],SubTo[i]);
	    }
	    res.end(data);
	  });
	});
	//io.set('transports', [ 'jsonp-polling' ]);
	
	$scope.sockets = [];
	
	io.sockets.on('connection', function (socket) {
	  socket.on('hello',function(){
		  if($scope.sockets.length >= __MAX_PLAYERS){
			  socket.emit("id",{player_id: false});
		  }else{
			  var freeSlot = [];
			  for(var i = 0; i < __MAX_PLAYERS; i++){
				freeSlot = freeSlot.concat([true]);
			  }
			  for(var i = 0; i < $scope.sockets.length; i++){
				freeSlot[$scope.sockets[i].player_id-1] = false;
			  }
			  socket.player_id = 0;
			  console.log(freeSlot);
			  for(var i = 0; i < __MAX_PLAYERS; i++){
				if(freeSlot[i]){
					socket.player_id = i+1;
					break;
				}
			  }
			  if(socket.player_id == 0){
				socket.emit("id",{player_id: false});
				$scope.$apply();
				return;
			  }
			  $scope.sockets.push(socket);
		  	  socket.emit("id",{player_id: socket.player_id});
			  socket.vJoy = edge.func(process.cwd() + "/cs/vJoy.cs");
			  socket.controller = {
				connected: false,
				pid: socket.player_id,
				buttons: {
					redButton: {bid: 5, status: false},
					greenButton: {bid: 1, status: false},
					blueButton: {bid: 2, status: false},
					Start: {bid: 8, status: false}
				},
				axis:{
					X: 0x4000,
					Y: 0x4000
				}
			  };
		  	  var dc = function(){
				  var socketId = $scope.sockets.indexOf(socket);
				  console.log(socketId);
				  if(socketId != -1){
					  $scope.sockets.splice(socketId,1);
				  }
				  $scope.$apply();
			  };
		  	  var hb = true;
		  	  var fun_hb = function(){
		  	  		if(!hb){
		  	  			console.log("disconnected!");
			  			dc();
			  		}else{
			  			hb = false;
			  			setTimeout(fun_hb, __TIMEOUT);
			  			socket.emit("hb");
			  		}
		  	  }
		  	  socket.on("hb",function(){
			  	 hb = true; 	  
		  	  });
		  	  fun_hb();
			  socket.on('press', function (data) {
				  if(socket.controller.buttons[data.button]){
					  socket.controller.buttons[data.button].status = true;
					  socket.vJoy(socket.controller,function (error, result) {
							if (error) throw error;
							console.log(result);
							socket.emit('vibrate');
					  });
				  }else{
					  console.log(data);
				  }
				  $scope.$apply();
			  });
			  socket.on('axis_start',function (data) {
				  socket.emit('vibrate');
			  });
			  socket.on('axis', function (data) {
				  socket.controller.axis.X = data.X;
				  socket.controller.axis.Y = data.Y;
				  socket.vJoy(socket.controller,function (error, result) {
						if (error) throw error;
						console.log(result);
				  });
				  $scope.$apply();
			  });
			  socket.on('release', function (data) {
				if(socket.controller.buttons[data.button]){
						socket.controller.buttons[data.button].status = false;
						socket.vJoy(socket.controller,function (error, result) {
						if (error) throw error;
						console.log(result);
				});
				}else{
					console.log(data);
				}
			    $scope.$apply();
			  });
		  }
		  $scope.$apply();
	  });
	});
}