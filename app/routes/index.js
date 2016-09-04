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

function ensureAuth(req, res, next){
	if (req.isAuthenticated())
		return next();

	res.redirect(req.get("Referrer") || "/");
};

/*
	Main page handler.
	Render "index.ejs" to the user and supply it with the data it needs.
*/
router.get("/", function(req, res){
	res.render("pages/index", {});
});

router.get("/error", function(req, res){
	res.render("pages/error");
});

//Just send out the layout page
// mainly for debugging what CSS files look like
router.get("/debug-layout", function(req, res){
	res.render("pages/layout", {});
});

router.get("/connect/steam", ensureAuth, function(req, res, next){
	if (req.user.steam.id){
		console.log("User has already authoerized steam");
		return res.redirect(req.get("Referer") || "/");
	}

	if (req.user)
		return next();

	res.redirect(req.get("Referer") || "/signup"); // Send them back where they came, or make them signup
}, passport.authorize("steam"));

router.get("/connect/twitch", ensureAuth, function(req, res, nxt){
	if (req.user.twitch.id){
		console.log("User has already authorized twitch");
		return res.redirect(req.get("Referer") || "/");;
	}

	if (req.user)
		return nxt();

	res.redirect(req.get("Referer") || "/signup");
}, passport.authorize("twitch"));


module.exports = router;
