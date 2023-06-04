var express = require('express')
app = express()
server = require('http').createServer(app)
var io = require('socket.io')(server)
app.use(express.static(__dirname))
server.listen(8081)
console.log('started')

var players = {};
var stars = {};
var host = null; 

io.on('connection', function (socket) {
    console.log('User ' + socket.id + ' connected' );
    if (!host) {
    	host = socket.id;
    	for (var i = 0; i < 11; i++) {
	  var x = 12 + 70*i;
	  var y = 0;
	  stars[i] = { x: x, y: y, id: i};
	}	
    }
    socket.emit('placeStars', stars);
  
    players[socket.id] = {        
        x: 0,
        y: 0,
        id: socket.id
    };    
        
    socket.emit('currentPlayers', players);    
    socket.broadcast.emit('newPlayer', players[socket.id]);
    
    socket.on('playerMovement', function (data) {
	  players[socket.id].x = data.x;
	  players[socket.id].y = data.y;	  
	  socket.broadcast.emit('playerMoved', { player: players[socket.id], anim: data.anim });
	});
    
    socket.on('starsMovement', function (stars) {
    	if (host === socket.id) {
	  socket.broadcast.emit('starsMovement', stars);
	}});
	
    socket.on('platformMovement', function (platform) {
    	if (host === socket.id) {
	  socket.broadcast.emit('platformMovement', platform);
	}});

    socket.on('collectStar', function (id) {        
  	delete stars[id]
        socket.broadcast.emit('collectStar', id);
    });
        
    socket.on('disconnect', function () {
        console.log('User ' + socket.id + ' disconnected');
        delete players[socket.id];   
             
        socket.broadcast.emit('disconnectPlayer', socket.id);        
            if (socket.id === host) {
            host = null;
            const newHost = players[Object.keys(players)[0]];
            if (newHost) {
              host = newHost.id;
            }
        }        
    });  
});

