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
		if (diff >= 1){
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
	res.render("pages/account/index", {user: req.user});
});

//TODO: Move into something like /account/security/two-factor
router.get("/mfa/:password", function(req, res){
	var key = "";
	if (req.user.two_factor.key){
		//.. They already have a key...
		key = req.user.two_factor.key;
	}else{
		key = authenticator.generateKey();
		mongo.getModel("User").findOne({id: req.user.id}, function(err, doc){
			doc.two_factor.key = crypto.encryptData(req.params.password + doc.salt, key);

			doc.two_factor.enabled = true;
			doc.save(function(error){
				console.log("Saved token to user's account: " + err +"_" + error);
			});
		});
		// User#two_factor.key = encrypted
	}

	var uri = authenticator.generateTotpUri(
		key, req.user.username, "FMITAD",
		"SHA1", 6, 30);
	console.log("genToken: " + authenticator.generateToken(key));
	res.render("pages/account/mfa", {
		key: key,
		otp_uri: uri
	});
});

router.post("/mfa/:password", function(req, res){
	var token = req.body.token;
	var key = crypto.decryptData(req.params.password + req.user.salt, req.user.two_factor.key);
	console.log("Decrypted key: " + key);
	var auth = authenticator.verifyToken(key, token);
	var err, succ;

	console.log(auth);
	if (auth){
		succ = "Successfully set up 2fa";
	}else{
		err = "Error authenticating";
	}

	res.render("pages/account/mfa", {
		error: err,
		success: succ,
		key: key,
		otp_uri: ""
	});

});


module.exports = router;
