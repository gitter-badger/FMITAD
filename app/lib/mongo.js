var mongoose = require("mongoose"),
    config = require("../../config.json"),
    path = require("path");

var Schema = mongoose.Schema;

// An array to hold our Models
var Models = [];

/*
    Constructor for this module.
    This should set up the connection to the mongodb and make sure the models are ready to use

    It should use the data from config.json to build the URIs
    It should look in the "schemas/" directory for the schemas to create models with
*/
function Mongo(){
    if (!(this instanceof Mongo)){
        return new Mongo();
    }

    var uri = this.getUri();
    if (uri){
        //Just in case i need the Connection
        // I might not but... I always know I can count on it
        // being here
        this.Connection = mongoose.connect(uri);
    }else{
        console.log("Error: URI isn't correct...\nPlease modify the config.json file.");
        process.exit();
    }

    //We have connected to out Database..
    // register models etc
    this.loadSchemas(path.join(__dirname, "./schemas/"));
    console.log("Schemas loaded.");
};

/*
    Function should load the schemas defined in the /schemas folder and make
    a model out of them.
*/
Mongo.prototype.loadSchemas = function(schemaDir){
    var fs = require("fs");
    fs.readdirSync(schemaDir).forEach(function(filename){
        var filepath = schemaDir + filename;

        if (fs.statSync(filepath).isDirectory()){
            //Recursivly load all schemas
            loadSchemas(filepath + "/");
        }else{
            // If it's a js file
            if (filename.split(".").pop() == "js"){
                var modelName = filename.split(".")[filename.split(".").length - 2];
                //console.log(modelName + " = " + filepath);
                var s = require(filepath);

                Models[modelName] = mongoose.model(modelName,  s);
            }
        }

    });
};

/*
    Allows other files to gain access to the models constructed.

    To create a new entry in the DB do:
        var model = new getModel( ModelName )();
        model.save ( function(err) );

    To search the DB do:
        getModel( ModelName ).find( { } )

    If the model doesn't exist, then the function will throw an error

    modelName is case-sensitive (the filename found in "schemas/")

*/
Mongo.prototype.getModel = function(modelName){
    if (modelName in Models)
            return Models[modelName];

    console.log("Throwing error : getModel(" + modelName + ")");
    throw new Error("No model with the name '" +modelName+ "' exists");
};

// Constructs and return the URI to connect to the main DB
Mongo.prototype.getUri = function(){
    var uri = "mongodb://";
    // If we have a username and password set in the config.json file, use them!
    if (config.mongo.username && config.mongo.password)
        uri += config.mongo.username + ":" + config.mongo.password + "@";

    //If the host doesn't exist
    // OR the host value is empty
    if ( !config.mongo.host || config.mongo.host == ""){
        //Since we can't connect to a server without
        // the host address, we'll just exit this function
        console.log("ERROR: No host to connect to.");
        return null;
    }

    //Just tell the user that we're going to be using default values
    //since they didn't supply anything
    if (!config.mongo.port)
        console.log("No port found... Defaulting to '27017'");
    if (!config.mongo.database)
        console.log("No database found... Defaulting to 'FMITAD'");

    //     Add host                   add port OR default               add database OR default
    uri += config.mongo.host + ":" + (config.mongo.port || 27017) + "/" + (config.mongo.database || "FMITAD");

    //Return the URI
    return uri;
};

// Constructs and returns the URI to connect to the session DB
Mongo.prototype.getSessionUri = function(){
    var uri = "mongodb://";
    // If we have a username and password set in the config.json file, use them!
    if (config.mongo.username && config.mongo.password)
        uri += config.mongo.username + ":" + config.mongo.password + "@";

    //If the host doesn't exist
    // OR the host value is empty
    if ( !config.mongo.host || config.mongo.host == ""){
        //Since we can't connect to a server without
        // the host address, we'll just exit this function
        console.log("ERROR: No host to connect to.");
        return null;
    }

    //Just tell the user that we're going to be using default values
    //since they didn't supply anything
    if (!config.mongo.port)
        console.log("No port found... Defaulting to '27017'");
    if (!config.mongo.session_db)
        console.log("No session database found... Defaulting to 'FMITAD-sessions'");

    //     Add host                   add port OR default               add database OR default
    uri += config.mongo.host + ":" + (config.mongo.port || 27017) + "/" + (config.mongo.session_db || "FMITAD-sessions");

    //Return the URI
    return uri;
};



module.exports = Mongo();
