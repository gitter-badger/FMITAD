// file for /account

var express = require("express");
var router = express.Router();

function ensureAuth(req, res, next){
	if (req.isAuthenticated())
		return next();

	res.redirect("/");
};
router.use(ensureAuth);


router.get("/", function(req, res){
});


module.exports = router;
