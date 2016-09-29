
var cluster = require("cluster");

if(cluster.isMaster){

    var cpuCount = require('os').cpus().length;

    console.log("Setting up clustering for " + cpuCount + " CPUs");

    for(var i = 0; i < cpuCount; i++){
        cluster.fork();
    }

    cluster.on("exit", function(worker){
        console.log("Worker %d died :( I'm starting him up again.", worker.id);
        cluster.fork();
    });

}else{
    var myApp = require("./app.js"),
        server = require('http').Server(myApp);
    
    // Start listening on the specified port
    server.listen(myApp.get("port"), function(){
    	console.log("Cluster %d listening on port: %d", cluster.worker.id, myApp.get("port") );
    });

}
