// TODO: Put /api/ handlers in here
var express = require("express");
var router = express.Router();
var passport = require("passport");

// Destroy the session (log the user out) then send them to the home page
router.get("/signout", function(req, res){
	//TODO: Sign the user out then re-direct them home
	req.session.destroy(function(err){
		res.redirect("/");
	});
});

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

router.get("/steam/verify", passport.authorize("steam", {
	failureRedirect: "/"
}), function (req, res){
	res.send("Linked!");
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

router.get("/twitch/verify", passport.authorize("twitch", {
	failureRedirect: "/"
}), function(req, res){
	res.send("Linked?");
});

module.exports = router;
