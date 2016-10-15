var analytics = require("./sockets/analytics.js"),
    ua = require("express-useragent"),
    //mongoStore = require("connect-mongo"),
    cookieParser = require("cookie-parser");

var clients = {};

function Helper ( io ){
    if (!(this instanceof Helper)){
        return new Helper(io);
    }

    io.on("connection", function(socket){

        if (!socket.request.headers.cookie){
            //They might not have a session yet.
            return;
        }

        var sessionId = getCookie(socket.request.headers.cookie, "connect.sid");
        //console.log("User socket connected Sid:\n\t" + sessionId);
        if (sessionId){
            //Incase
            if (clients[sessionId] && clients[sessionId].socket){
                clients[sessionId].socket.disconnect();
            }

            clients[sessionId] = { socket: socket };
            analytics.initUser( clients[sessionId], ua.parse(socket.handshake.headers["user-agent"]) );

            socket.on("page view", function( data ){
                analytics.pageView(clients[sessionId], data.ref, data.loc);
            });

            socket.on("disconnect", function(){
                delete clients[sessionId];
            });

        }

    });
};

function getCookie(cookieString, cname) {
    var name = cname + "=";
    var ca = cookieString.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
}


Helper.sendNotification = function( sessionId, notfication ){
    clients[sessionId].socket.emit("notification", notification);
};

Helper.getSocketFor = function( sessionId ){
    if (sessionId in clients){
        return clients[sessionId].socket;
    }

    return undefined;
}

module.exports = Helper;
