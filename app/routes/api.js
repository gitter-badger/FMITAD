// TODO: Put /api/ handlers in here
var express = require("express");
var router = express.Router();
var passport = require("passport");

function authOnly(req, res, next){
	if (req.isAuthenticated())
		return next();

	res.redirect(req.get("Referrer") || "/login");
};
router.use(authOnly); // Only allow authenticated user to access /api :D

// verify that the user has authorized the application, then redirect to the previous page or /account
// If they already authorized, then boot them back
router.get("/steam/verify",function(req, res, next){
	if (req.user.steam.id)
		return res.redirect(req.get("Referer") || "/");
	next();
}, passport.authorize("steam", {
	failureRedirect: "/"
}), function (req, res){
	res.redirect(req.get("Referer") || "/account");
});

// verify that the user has authorized the application, then redirect to the previous page or /account
router.get("/twitch/verify",function(req, res, next){
	if (req.user.twitch.id)
		return res.redirect(req.get("Referer") || "/");
	next();
}, passport.authorize("twitch", {
	failureRedirect: "/"
}), function(req, res){
	res.redirect(req.get("Referer") || "/account");
});

/*
########################################################################
	DEBUG ROUTES BELOW
	DELETE WHEN DONE DEVELOPING/DEBUGGING
	SERIOUSLY, YOU DON'T WANT USERS TO ACCESS THE BELOW
########################################################################
*/

router.get("/dump-session", function(req, res){
	res.send(req.session.passport);
});

router.get("/set-data/:password", function(req, res){
	var pass = req.params.password;
	var data = req.user.two_factor.key;
	var crypto = require("../lib/cryptoHelper");

	console.log("Encrypting: " + data);
	console.log("With password: "+ pass);

	var ciphertext = crypto.encryptData(pass + req.user.salt, data);

	console.log("Encrypted: " +ciphertext);
	res.redirect("/api/get-data/" + pass + "?data=" + ciphertext);
});

router.get("/get-data/:password", function(req, res){
	var pass = req.params.password;
	var data = req.query.data;
	var crypto = require("../lib/cryptoHelper");

	console.log("Decrypting: " + data);
	console.log("With password: "+ pass);

	var plaintext = crypto.decryptData(pass + req.user.salt, data);

	console.log("Plaintext: " +plaintext);

	res.send(plaintext);
});

router.get("/model/:model", function(req, res){
	var mongo = require("../lib/mongo");
	var Model = new mongo.getModel(req.params.model);

	res.render("pages/error", {
		message: "Found model '" + req.params.model + "'",
		error: {
			status : "Success",
			message: "",
			stack: Model
		}
	});
});

router.get("/users", function(req, res){
	var mongo = require("../lib/mongo");
	var m = mongo.getModel("User");

	m.find({}, function(err, docs){
		res.send(docs);
	});

});

router.get("/users/delete", function(req, res){
	var mongo = require("../lib/mongo");
	var m = mongo.getModel("User");

	m.find({}, function(err, docs){
		docs.forEach(function(doc){
			doc.remove();
		});
		res.redirect("/api/users");
	});
});

router.get("/steam/delete", function(req, res){
	req.user.steam = {};
	req.user.save(function(_err){
		res.send("Deleted steam");
	});
});

router.get("/twitch/delete", function(req, res){
	req.user.twitch = {};
	req.user.save(function(_err){
		res.send("Deleted twitch");
	});
});

module.exports = router;
