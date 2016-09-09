// TODO: Put /api/ handlers in here
var express = require("express");
var router = express.Router();
var passport = require("passport");
var mongo = require("../lib/mongo");

function authOnly(req, res, next){
	if (req.isAuthenticated() || req.xhr)
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
	res.redirect(req.get("Referer") || "/account"); // Success :D
});

// verify that the user has authorized the application, then redirect to the previous page or /account
router.get("/twitch/verify",function(req, res, next){
	if (req.user.twitch.id)
		return res.redirect(req.get("Referer") || "/");
	next();
}, passport.authorize("twitch", {
	failureRedirect: "/"
}), function(req, res){
	res.redirect(req.get("Referer") || "/account"); // Success :D
});

router.get("/search-user", function(req, res, next){
	// The query passed to this can represent the following data:
	//		- email
	// 		- username
	//		- id
	var q = req.query.q;
	if (!q || q == "" || q == " ") {
		console.log("No q");
		return res.send([]);
	}

	var reg = new RegExp("^" + q , "i");
	console.log("Searching: " + q);

	mongo.getModel("User").find({
		$or: [
			{id: { $regex: reg }},
			{username: { $regex: reg }},
			{email: { $regex: reg }}
		]
	}, "username id email profile",{
		sort: {
			username: 1
		}
	}, function(err, docs){
		if (err){
			console.log("Error searching users: " + err);
			return res.send([]);// Just send an empty array.. Tell them no-one was found :(
		}

		console.log("Sending: " + JSON.stringify(docs));
		res.send(docs);
	});
});

/*
########################################################################
	DEBUG ROUTES BELOW
	DELETE WHEN DONE DEVELOPING/DEBUGGING
	SERIOUSLY, YOU DON'T WANT USERS TO ACCESS THE BELOW
########################################################################
*/

function generateUser(_username, _email, _password){
	var crypto = require("../lib/cryptoHelper");
	var uuid = require("uuid4");

	mongo.getModel("User").findOne( {email: _email}, function(err, doc){
		var salt = uuid();

		var User = new mongo.getModel("User")({
			id: uuid(),

			username: _username,
			email: _email,
			salt: salt,
			password: crypto.hashPassword(salt, _password)
		});

		User.save(function(err){
			if (err)
				throw err;
			console.log("Saved user: " + User.id);
		});

	});
}

router.get("/add-users/:amount", function(req, res){
	var amount = req.params.amount;
	var uuid = require("uuid4");

	var users = [];
	for(var i = 0; i< amount; i++){
		var username = "test_" + uuid().substr(0,8);
		var email = username + "@test.com";
		var password = "test123";
		generateUser(username, email, password);

		users.push ( {username: username, email: email} );
	}

	res.send(users);

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

router.get("/users/delete/:id", function(req, res){
	var mongo = require("../lib/mongo");
	var m = mongo.getModel("User");

	m.find({id: req.params.id}, function(err, docs){
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
