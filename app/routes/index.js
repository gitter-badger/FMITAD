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
