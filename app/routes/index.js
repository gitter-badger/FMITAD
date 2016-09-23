// Put / handlers in here
/*
/ - Landing page
/login - Login
/signup
etc
*/
var express = require("express");
var router = express.Router();

var passport = require("passport");

/*
	Main page handler.
	Render "index.ejs" to the user and supply it with the data it needs.
*/
router.get("/", function(req, res){
	res.render("pages/index", {});
});

router.get("/users", function(req, res){
	res.render("pages/users");
});

/*
	Handle authentication/reauthentication to give some extra security to accounts.
	Only allow user's to change their passwords/security details if they have
	authenticated within the last 5mins
*/
router.post("/authenticate", function(req, res){
	var type = "none";

	if (req.body.password && req.body.token){
		type = "2fa"; // Supplied token and password, 2fa
	}else if (req.body.password){ // They only supplied the password
		type = "password";
	}

	if (type == "none"){
		// They haven't supplied a password or token :( Icri
		return res.render("pages/account/re-auth");
	}

	var crypto = require("../lib/cryptoHelper");
	var authenticator = require('authenticator');

	var isCorrect = crypto.checkPassword(req.user.salt, req.body.password, req.user.password, req.user.crypto.hash );
	if (isCorrect){

		if (type == "password"){
			req.session.last_authenticated = Date.now();
			return res.redirect(req.get("Referer") || "/profile"); // Send them to their profile... I don't know why.. Just do it k?
		}

		// TODO: 2FA
		var decryptedKey = crypto.decryptData(req.body.password + req.user.salt, req.user.two_factor.key, req.user.crypto.cipher );
		var auth = authenticator.verifyToken(decryptedKey, req.body.token);
		if (auth){
			//Success!
			req.session.last_authenticated = Date.now();
			res.redirect(req.get("Referer") || "/profile");
		}else{
			//Oh snap! They didn't authenticate :(
			res.render("pages/account/re-auth");
		}

	}else{
		// They have entered the wrong password..
		// Log this attempt? End session?
		// For now.. Just tell them no
		res.render("pages/account/re-auth");
	}


});

router.get("/confirm/:token", function(req, res){
	var mongo = require("../lib/mongo");
	var m = mongo.getModel("User");

	m.findOne({email_token: req.params.token}, function(err, doc){
		if (err){
			req.session.error = err;
			return res.redirect("/");
		}
		if (!doc){
			req.session.error = "Sorry, that token doesn't exist";
			return res.redirect("/");
		}

		if (doc.email_expires < Date.now())
			return res.render("pages/index", {error: "Confirmation expired.. Please sign up again."});

		doc.email_expires = null;
		doc.email_token = null;
		doc.save(function(err){
			if (err)
				return res.render("pages/index", {error: err});

			req.login(doc, function(err){
				if (err)
					return res.render("pages/index", {error: "Couldn't log in :("});

				req.session.last_authenticated = Date.now();
				res.redirect("/");
			});

		});
	});

});

router.get("/following", function(req, res){
	var mongo = require("../lib/mongo");
	var m = mongo.getModel("User");

	m.find({ id: {$in: req.user.following} }, "username id email profile", {sort: {username: 1}}, function(err, docs){
		res.render("pages/users", {users: docs});
	} );

});

router.get("/user/:id/follow", function(req, res){
	var id = req.params.id;
	if (id == req.user.id){
		return res.redirect("/users");
	}
	if (id in req.user.following){
		return res.redirect("/users");
	}

	req.user.following.push(id);
	req.user.save(function(err){
		res.send("Success");
	});

});

router.get("/about", function(req,res){
	res.render("pages/about");
});

router.get("/error", function(req, res){
	res.render("pages/error");
});

//Just send out the layout page
// mainly for debugging what CSS files look like
router.get("/debug-layout", function(req, res){
	res.render("pages/layout", {});
});

/*
	Allow the user to connect their steam account.
	Only allow user's who are logged in
	If they've already connected, then kick them to the curb
*/
router.get("/connect/steam", function(req, res, next){
	if (req.user.steam.id){
		return res.redirect(req.get("Referer") || "/");
	}

	if (req.isAuthenticated())
		return next();

	res.redirect(req.get("Referer") || "/signup"); // Send them back where they came, or make them signup
}, passport.authorize("steam"));

/*
	Allow the user to connect their twitch account.
	Only allow user's who are logged in
	If they've already connected, then kick them to the curb
*/
router.get("/connect/twitch", function(req, res, nxt){
	if (req.user.twitch.id){
		console.log("User has already authorized twitch");
		return res.redirect(req.get("Referer") || "/");;
	}

	if (req.isAuthenticated())
		return nxt();

	res.redirect(req.get("Referer") || "/signup");
}, passport.authorize("twitch"));


module.exports = router;
