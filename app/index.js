
var myApp = require("./app.js"),
    server = require('http').Server(myApp);
    
var io = require('socket.io')(server);

require("./lib/socketHelper.js")(io);

server.listen(myApp.get("port"), function(){
    console.log("Server listening on port: %s", myApp.get("port") );
});
