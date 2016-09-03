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
	failureRedirect: "/error",
	successRedirect: "/"
	})
);

router.get("/twitch/verify", passport.authorize("twitch", {
	failureRedirect: "/error",
	successRedirect: "/"
	})
);

module.exports = router;
