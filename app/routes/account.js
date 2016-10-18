// file for /account

var express = require("express");
var router = express.Router();
var authenticator = require("authenticator");
var mongo = require("../lib/mongo");
var crypto = require("../lib/cryptoHelper");

// Only allow passthrough to the next middleware if they're logged in
function ensureAuth(req, res, next){
    if (req.isAuthenticated())
        return next();

    res.redirect(req.get("Referrer") || "/");
};
router.use(ensureAuth);

/*
    Checks to see if the user has authenticated in the last 5mins
    if they haven't then show them the password page (should submit "password" to "/authenticate");

    /authenticate should refresh the "last_authenticated" variable

    The page displayed to the user should depend on wether they have 2fa enabled
    or not..
    If they do display "enter 2fa token"
    if they don't display "enter password"

    TODO: 2FA re-authentication

    Actually.. Thinking about it... The 2fa token should only be entered for
    the login, we can be sure then the person logged in is the user so,
    asking them to enter a new token every 5mins seems pointless...
    Maybe we should stick with the password then?
*/
function shouldReAuth(req, res, next){
    var now = Date.now();

    if(req.session.last_authenticated){
        var then = req.session.last_authenticated;
        var diff = (now - then) / 1000;// Difference in seconds from ms
        diff = diff / 60; // Mins
        if (diff >= 5){
            // Session expired.. Requires re-auth
            return res.render("pages/account/re-auth");
        }else{
            return next();
        }
    }

    // No last_authenticated... Re auth them...
    return res.render("pages/account/re-auth");
}

router.get("/", shouldReAuth, function(req, res){
    res.render("pages/account/index");
});

router.post("/two-factor", function(req, res){
    var password = req.body.password;
    var enabled = req.body.enable;

    var isCorrect = crypto.checkPassword( req.user.salt, password, req.user.password, req.user.crypto.hash );

    if (isCorrect){
        var key;
        if (req.user.two_factor.key){
            key = req.user.two_factor.key;
        }else{
            key = authenticator.generateKey();
            req.user.two_factor.key = crypto.encryptData(password + req.user.salt, key, req.user.crypto.cipher );

            req.user.save(function(err){
                if (err){
                    console.log("ERROR: COULDN'T SAVE TWO FACTOR KEY :(");
                    console.log(err);
                }
            });

        }

        req.user.two_factor.enabled = enabled;
        req.user.save(function(err){
            req.session.success = enabled ? "Enabled two factor authentication" : "Disabled two factor authentication";
            return res.redirect("/profile#security");
        });

    }else{
        req.session.error = "Incorrect password";
        return res.redirect("/profile#security");
    }
});

router.post("/two-factor-verify", function(req, res){
    var token = req.body.token;
    var password = req.session.password;

    var isCorrect = crypto.checkPassword( req.user.salt, password, req.user.password, req.user.crypto.hash );

    if(isCorrect){

        var key = crypto.decryptData(password + req.user.salt, req.user.two_factor.key, req.user.crypto.cipher);
        var auth = authenticator.verifyToken(key, token);
        console.log("Auth: " + key);
        if (auth){
            req.session.success = "You have successfully set up 2fa";
            req.session.last_authenticated = Date.now();
            res.redirect("/profile#security");
        }else{
            req.session.error = "Sorry, that token is invalid. Please make sure your phone's time is set to automatic from network/internet. I've disabled two factor authentication for the time being.";

            req.user.two_factor.enabled = false;
            req.user.save(function(err){ console.log("Error disabling 2fa from invalid token? " + err); });

            res.redirect("/profile#security");
        }

    }else{
        req.session.error = "Incorrect password. Couldn't verify token. I've disabled 2fa for the time being.";

        req.user.two_factor.enabled = false;
        req.user.save(function(err){ console.log("Error disabling 2fa? " + err); });

        res.redirect("/profile#security");
    }

});

module.exports = router;
