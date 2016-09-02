var User = {

	id : {type: String, unique: true }, //UUID4 format, allows for multiple people to have same username
	username : {type: String, unique: false}, //Turn to true if we don't want multiple people with same username...
	email : {type: String, unique: true},
	salt: String, // Salt for hashing password with
	password: String, // Hashed ( password + salt )

	twitch: {
		id: String,
		username: String,
		token: String
	},
	steam: {
		id: String,
		username: String
	},


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
		*/
	}

};

module.exports = User;
