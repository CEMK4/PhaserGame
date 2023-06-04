var express = require('express')
app = express()
var server = require('http').createServer(app)
var io = require('socket.io')(server)

app.use(express.static(__dirname))

server.listen(80)
console.log('Server has started')

var players = {};

io.on('connection', function (socket) {
    console.log('Подключился пользователь ' + socket.id);

    var player = {
        id: socket.id,
        x: 0,
        y: 0
    };
    players[socket.id] = player;

    socket.on('playerMovement', function (data) {
	  players[socket.id].x = data.x;
	  players[socket.id].y = data.y;	  
	  socket.broadcast.emit('playerMoved', { player: players[socket.id], anim: data.anim });
	});

    socket.on('disconnect', function () {
        console.log('Пользователь '  + socket.id + ' отключился');
        delete players[socket.id];        
        socket.broadcast.emit('playerDisconnect', socket.id);
    });
    
    socket.emit('currentPlayers', players);    
    socket.broadcast.emit('newPlayer', player);
});

