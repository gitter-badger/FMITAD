// Put / handlers in here
/*
/ - Landing page
/login - Login
/signup
etc
*/
var express = require("express");
var router = express.Router();

router.get("/", function(req, res){
	res.render("pages/index", {});
});

//Just send out the layout page
// mainly for debugging what CSS files look like
router.get("/debug-layout", function(req, res){
	res.render("pages/layout", {});
});

module.exports = router;
