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

router.get("/", function(req, res){
	res.render("pages/index", {});
});

//Just send out the layout page
// mainly for debugging what CSS files look like
router.get("/debug-layout", function(req, res){
	res.render("pages/layout", {});
});

router.get("/connect/steam", function(req, res, next){
	if (req.user.steam.id){
		console.log("User has already authoerized steam");
		return res.redirect(req.get("Referer") || "/");
	}

	if (req.user)
		return next();

	res.redirect(req.get("Referer") || "/signup"); // Send them back where they came, or make them signup
}, passport.authorize("steam"));

router.get("/connect/twitch", function(req, res, nxt){
	if (req.user.twitch.id){
		console.log("User has already authorized twitch");
		return res.redirect(req.get("Referer") || "/");;
	}

	if (req.user)
		return nxt();

	res.redirect(req.get("Referer") || "/signup");
}, passport.authorize("twitch"));


module.exports = router;
