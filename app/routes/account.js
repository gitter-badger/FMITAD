// file for /account

var express = require("express");
var router = express.Router();
var authenticator = require("authenticator");
var mongo = require("../lib/mongo");

function ensureAuth(req, res, next){
	if (req.isAuthenticated())
		return next();

	res.redirect("/");
};
router.use(ensureAuth);


router.get("/", function(req, res){
});

router.get("/mfa", function(req, res){
	var key = "";
	if (req.user.two_factor.key){
		//.. They already have a key...
		key = req.user.two_factor.key;
	}else{
		key = authenticator.generateKey();


	}
	mongo.getModel("User").findOne({id: req.user.id}, function(err, doc){
		doc.two_factor.key = key;
		doc.two_factor.enabled = true;
		doc.save(function(error){
			console.log("Saved token to user's account: " + err +"_" + error);
		});
	});

	var uri = authenticator.generateTotpUri(
		key, req.user.username, "FMITAD",
		"SHA1", 6, 30);
	console.log("genToken: " + authenticator.generateToken(key));
	res.render("pages/account/mfa", {
		key: key,
		otp_uri: uri
	});
});

router.post("/mfa", function(req, res){
	var token = req.body.token;
	var key = req.user.two_factor.key;

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
