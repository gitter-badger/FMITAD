/*
	Do some sweet stuff to aid in the design
*/
var express = require("express");
var router = express.Router();


//Creates a dummy user object to use in testing..
var testUser = {
	id: "a1a64487-d723-42e0-8dd0-55f0807a94da",
	username: "Test Account",
	nameID: "Test Account#a1a6",
	email: "test@gmail.com",

	isAdmin: true,// Toggle these to see what other conditions look like
	isMod: true,    // ^^
	verified: true, // ^^

	following: [ ],

	twitch: {
		id: "TwitchID",
		username: "TestAccount821"
	},

	steam: {
		id: "SteamID",
		username: "I am awesome test user"
	},

	profile: {
		status: "Online", // Can be : Online, Offline, Invisible
		image: null, //Leave null for robohash image (http://robohash.org/{id})
		bio: "I am an awesome test user.. There's nothing more for me to say"
	}

};

var data = {
	"index" : {
		error: "Test error message",
		success: "Test success message",
		notice: "Test notice message",
		user: testUser // Set to null to see what "Guests" see (no user logged in)
	},
	"about" : {
		user: testUser
	},
	"users" : {
		user: testUser
	},
	"account/index": {
		user: testUser
	}
};

// Render out the page they've given.
// e.g. /dev/index will render "views/pages/index"
// To get into folders, seperate with a space (%20 or +)
router.get("/:page", function(req, res){
	var page = req.params.page;
	page = page.replace(/%20/g, "/");
	page = page.replace(/\+/g, "/");

	console.log(page);
	//Some pages need data passed to them...
	res.render("pages/" + page, data[page]);
});

module.exports = router;
