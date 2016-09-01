var mongoose = require("mongoose"),
	config = require("../../config.json"),
	path = require("path");

var Schema = mongoose.Schema;

// An array to hold our Models
var Models = [];

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
	this.loadSchemas(path.join(__dirname, "../../schemas/"));
	console.log("Schemas loaded.");
};

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
				var s = new Schema(require(filepath));

				Models[modelName] = mongoose.model(modelName,  s);
			}
		}

	});
};

Mongo.prototype.getModel = function(modelName){
	if (modelName in Models)
			return Models[modelName];
	
	console.log("Throwing error : getModel(" + modelName + ")");
	throw new Error("No model with the name '" +modelName+ "' exists");
};

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
		console.log("No database found... Defaulting to 'ScrimSpace'");

	//     Add host                   add port OR default               add database OR default
	uri += config.mongo.host + ":" + (config.mongo.port || 27017) + "/" + (config.mongo.database || "FMITAD");

	//Return the URI
	return uri;
};



module.exports = Mongo();
