var analytics = require("./sockets/analytics.js");
var ua = require("express-useragent");

function Helper ( io ){
    if (!(this instanceof Helper)){
		return new Helper(io);
	}

    io.on("connection", function(socket){
        console.log("User has connected: " + socket.id);
        analytics.initUser( socket.id, ua.parse(socket.handshake.headers["user-agent"]) );

        socket.on("page view", function( data ){
            analytics.pageView(socket.id, data.ref, data.loc);
        });

        socket.on("disconnect", function(){
            analytics.disconnect(socket.id);
        });
    });
};

module.exports = Helper;
