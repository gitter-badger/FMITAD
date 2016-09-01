// TODO: Put /api/ handlers in here
var express = require("express");
var router = express.Router();

// These are all mounted at /api

// /api/login
app.post("/login", function(req, res){
	//TODO: Log the user in then re-direct them home
});
// /api/signout
app.post("/signout", function(req, res){
	//TODO: Sign the user out then re-direct them home
});

module.exports = router;
