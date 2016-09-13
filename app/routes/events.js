// mounted at /events
var express = require("express");
var router = express.Router();

router.get("/", function(req, res){
	res.render("pages/events/index");
});


module.exports = router;
