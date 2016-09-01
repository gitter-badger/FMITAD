// TODO: Put /api/ handlers in here
var express = require("express");
var router = express.Router();

// These are all mounted at /api

// /api/login
router.post("/login", function(req, res){
	//TODO: Log the user in then re-direct them home
});
// /api/signout
router.post("/signout", function(req, res){
	//TODO: Sign the user out then re-direct them home
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

module.exports = router;
