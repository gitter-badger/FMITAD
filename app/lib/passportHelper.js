var mongoUtil = require("./mongo");
var config = require("../../config.json");
var crypto = require("../lib/cryptoHelper");

/*
    Set up passport to use the stratgies. The stratgies should be setup using data from the config.json file
*/
module.exports = function(passport){

    var steamStrategy = require("../strategy/steamStrategy"),
        twitchStrategy = require("../strategy/twitchStrategy");

    //Define passport usage
    passport.use(new steamStrategy({
            returnURL: config.steam.redirect_uri,
            realm: config.steam.realm,
            apiKey: config.steam.api_key,
            passReqToCallback: true
        },
        // Executed when authorized
        function(req, identifier, profile, done){
            process.nextTick(function(){
                if (!req.user){
                    return done("Not logged in!");
                }

                mongoUtil.getModel("User").findOne({ 'steam.id': profile.id }, function(err, doc){
                    if (err || doc)
                        return done( err || "Account already linked to " + doc.id); // If the account is linked

                    var user = req.user;

                    user.steam.id = profile.id;
                    user.steam.username = profile.displayName;
                    user.save(function(_err){
                        if (_err)
                            return done( _err, null );
                        console.log("Returning : " + JSON.stringify(user));
                        return done(null, user);
                    });

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
            process.nextTick(function(){
                if (!req.user){
                    return done("Not logged in!");
                }

                mongoUtil.getModel("User").findOne({ 'twitch.id': profile.id }, function(err, doc){
                    if (err || doc)
                        return done( err || "Account already linked to " + doc.id); // If the account is linked

                    var user = req.user;

                    if (crypto.checkPassword(user.salt, req.session.password, user.password, user.crypto.hash )){
                        console.log("Twitch updating (" + accesstoken + "): "+ JSON.stringify(profile));

                        user.twitch.token = crypto.encryptData(req.session.password + req.user.salt, accesstoken);
                        user.twitch.id = profile.id;
                        user.twitch.username = profile.username;

                        user.save(function(err){
                            if (err)
                                return done( err, null )

                            done(null, user);
                        });
                    }else{
                        req.session.destroy(function(err){
                            res.render("pages/auth/login", {error: "Incorrect password stored in session.. Please log in again"});
                        });
                    }


                });
            });

        }
    ));

    passport.serializeUser(function(user, done){
        done(null, user.id);
    });

    passport.deserializeUser(function(obj, done){
        mongoUtil.getModel("User").findOne({id: obj}, function(err, user){
            done (err, user);
        });
    });
};
