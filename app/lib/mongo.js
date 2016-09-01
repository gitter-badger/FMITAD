var mongoose = require("mongoose"),
	config = require("../../config.json"),
	path = require("path");

var Schema = mongoose.Schema;

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

	/*
	this.UserModel = mongoose.model("User", new Schema({
		id : {type: String, unique: true }, //UUID4 format, allows for multiple people to have same username
		username : {type: String, unique: false}, //Turn to true if we don't want multiple people with same username...
		email : {type: String, unique: true},
		salt: String, // Salt for hashing password with
		password: String, // Hashed ( password + salt )

		profile: {
			//Maybe implement this at somepoint?
			// I think it would be nice to have

			status: String // Offline, Online, Invisible (Show offline to everyone except friends);
		},

		two_factor: {
			enabled: {type: Boolean, default: false}  // Wether they have 2FA enabled or not
			//type: String // App, Sms??
			/*
				Since I'm not a security expert, I've decided not to allow Sms
				2FA because it would mean storing user's phone number
				and I can't be sure it's not going to be leaked..
				So, I'm just forcing them to use an APP instead as I don't have
				to store anything sensitive in the DB

		}
	}));*/
};

Mongo.prototype.loadSchemas = function(schemaDir){
	var fs = require("fs");
	fs.readdirSync(schemaDir).forEach(function(filename){
		var filepath = schemaDir + filename;

		if (fs.statSync(filepath).isDirectory()){
			//Recursivly load all schemas
			loadSchemas(filepath + "/");
		}else{
			// If it's a json file
			if (filename.split(".").pop() == "js"){
				var modelName = filename.split(".")[filename.split(".").length - 2];
				console.log(modelName + " = " + filepath);
				this[modelName + "Model"] = mongoose.model(modelName, require(filepath));
			}
		}

	});
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
