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


router.get("/", function(req, res){
	res.send("Hello :D");
});

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

router.get("/mfa", function(req, res){

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
