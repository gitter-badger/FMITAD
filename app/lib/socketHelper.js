var analytics = require("./sockets/analytics.js");
var ua = require("express-useragent");

var clients = {};

function Helper ( io ){
    if (!(this instanceof Helper)){
		return new Helper(io);
	}

    io.on("connection", function(socket){
        console.log("User has connected: " + socket.id);

        //clients.push(socket);
        clients[socket.id] = { socket: socket };
        analytics.initUser( clients[socket.id], ua.parse(socket.handshake.headers["user-agent"]) );

        socket.on("page view", function( data ){
            analytics.pageView(clients[socket.id], data.ref, data.loc);
        });

        socket.on("disconnect", function(){
            delete clients[socket.id];
        });
    });
};

Helper.sendNotification = function( socketId, notfication ){
    clients[socketId].socket.emit("notification", notification);    
};

module.exports = Helper;
