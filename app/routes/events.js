// mounted at /events
var express = require("express");
var router = express.Router();

router.get("/", function(req, res){
	res.render("pages/events/index");
});

router.get("/create", function(req, res){
	req.session.error = "Sorry, that's not implemented yet :'(";
	res.redirect("/events");
});

router.get("/:id", function(req, res){
	req.session.error = "Sorry, that's not implemented yet :'(";
	res.redirect("/events");
});


module.exports = router;
