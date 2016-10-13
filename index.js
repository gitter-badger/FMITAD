// Entry point for the app. Run this file, everything else will follow
var myApp = require("./app/app.js"),
    server = require('http').Server(myApp);

var io = require('socket.io')(server);
require("./app/lib/socketHelper.js")(io);

server.listen(myApp.get("port"), function(){
    console.log("Server listening on port: %s", myApp.get("port") );
});
