var mongoUtil = require("./mongo");
var config = require("../../config.json");
module.exports = function(passport){

	var steamStrategy = require("../strategy/steamStrategy"),
		twitchStrategy = require("../strategy/twitchStrategy");

	//Define passport usage
	passport.use(new steamStrategy({
		returnURL: config.steam.redirect_uri,
		realm: "http://localhost/",
		apiKey: config.steam.api_key,
		passReqToCallback: true
		},
		function(req, identifier, profile, done){
			mongoUtil.getModel("User").findOne({id: req.user.id}, function(err, user){

				user.steam.id = profile.id;
				user.steam.username = profile.displayName;
				user.save(function(err){
					if (err)
						throw new Error(err);
					done(null, user);
				});

			});

		}
	));
	passport.use(new twitchStrategy({
			clientID: config.twitch.client_id,
			clientSecret: config.twitch.client_secret,
			callbackURL: config.twitch.redirect_uri,
			scope: config.twitch.scope.join(" "),
			passReqToCallback: true
		}, function(req, accesstoken, refreshtoken, profile, done){

			mongoUtil.getModel("User").findOne({id: req.user.id}, function(err, user){
				console.log("Twitch updating (" + accesstoken + "): "+ JSON.stringify(profile));

				user.twitch.token = accesstoken;
				user.twitch.id = profile.id;
				user.twitch.username = profile.username;

				user.save(function(err){
					if (err)
						throw new Error(err);

					done(null, user);
				});
			});

		}
	));

	passport.serializeUser(function(user, done){
		console.log("Serialize: " + JSON.stringify(user));
		done(null, user.id);
	});

	passport.deserializeUser(function(obj, done){
		console.log("Deserialize: " + JSON.stringify(obj));

		mongoUtil.getModel("User").findOne({id: obj}, function(err, user){
			done (err, user);
		});
	});
};
