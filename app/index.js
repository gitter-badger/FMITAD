
var cluster = require("cluster");
var myApp = require("./app.js"),
    server = require('http').Server(myApp);

if (myApp.get("env") == "development"){
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
        // Start listening on the specified port
        server.listen(myApp.get("port"), function(){
        	console.log("Cluster %d listening on port: %d", cluster.worker.id, myApp.get("port") );
        });

    }
}else{
    console.log("Just using one CPU");
    server.listen(myApp.get("port"), function(){
        console.log("Server listening on port: %d", myApp.get("port") );
    });
}
