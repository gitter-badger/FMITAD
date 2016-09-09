var express = require("express");
var router = express.Router();

var config = require("../../config.json");
var mongo = require("../lib/mongo");
var crypto = require("../lib/cryptoHelper");
var uuid = require("uuid4");
var https = require("https");
var authenticator = require("authenticator");

var multer = require('multer');
var storage = multer.diskStorage({
	filename: function(req, file, cb){
		cb(null, file.fieldName+ "-" + Date.now());
	}
});
var upload = multer({storage: storage});


// Only allow user access if they're not logged in.
function isLoggedIn(req, res, next){
	if (req.isAuthenticated())
		return res.redirect("/");
	next();
}

// Destroy the session (log the user out) then send them to the home page
router.get("/logout", function(req, res){
	if (req.isAuthenticated()){
		req.session.destroy(function(err){
			res.redirect("/");
		});
	}
});

// Show the signup form for the user to fill out.
// The actual signup logic is in the POST handler
router.get("/signup", isLoggedIn, function(req, res){
	var e;
	if (req.session.error){
		e = req.session.error;
		delete req.session.error;
	}
	res.render("pages/auth/signup", {
		error: e
	});
});

// Show the login form for the user to fill out
// Actual logic is in the POST handler
router.get("/login", isLoggedIn, function(req, res){
	var e;
	if (req.session.error){
		e = req.session.error;
		delete req.session.error;
	}

	res.render("pages/auth/login", {
		error: e
	});
});

// Show the form for  the user to enter their token
router.get("/session/two-factor", function(req, res, next){
	// Check if the user has come from the /login route

	// session.temp shoud only be set when comming from /login
	if (req.session.temp && req.session.temp.key){
		return next();
	}
	// If they don't have the data we need.. Just kick them to the curb
	res.redirect("/");
}, function(req, res){
	res.render("pages/auth/two-factor");
});

//Handle the 2fa stuff..
/*
	User should only get this far if they have come from /login POST handler and have POSTed their token

	The login handler will set some temp data in the current session (stored on server)
	we then use that supplied data to check the token is correct and log the user in

	if they haven't POSTed a token then we just render the page again (maybe show a error to?)
*/
router.post("/session/two-factor", function(req, res, next){
	if (req.session.temp && req.session.temp.key){
		return next();
	}
	res.redirect("/");

}, function(req, res){
	if (!req.body.token){ // They haven't supplied a code... (Is this even possible?)
		return res.render("pages/auth/two-factor"); // Just send them that page again
	}

	var token = req.body.token;
	var key = crypto.decryptData(req.session.password + req.session.temp.user.salt, req.session.temp.key);

	console.log("Temp: "+ key);

	var auth = authenticator.verifyToken(key, token);

	if(auth){
		req.login(req.session.temp.user, function(err){
			if (err)
				throw new Error ("couldn't log in :(");

			delete req.session.temp; // Delete the temp data... We don't need it now

			req.session.last_authenticated = Date.now();
			res.redirect("/");
		});
	}else{
		// Just silently fail and redirect them to the home page
		// Maybe log this attempt?
		res.redirect("/");
	}

});

// Handle login
/*
	The data passed to this handler should come from the form in "/views/pages/login" (or in the header)
	the data should be named "email" and "password"

	First thing we should do is get the user in out DB with the specified email (email must be unique in DB, username isn't)
	if we can't find the email, just send them to the signup page to register.

	If we do find the user in our DB, we check the password given against the password we have.
	If the password isn't correct (or there was an error logging in) we send them back to "/login" and tell them they supplied an invalid email/password.

	If the password is correct, we check if they have two-factor enabled.
	If they do, we redirect them to "/session/two-factor" and set the required session data.
	If they don't we log them in :)
*/
router.post("/login", isLoggedIn, function(req, res){
	var _email = req.body.email;
	var _password = req.body.password;
	mongo.getModel("User").findOne( {email: _email}, function(err, doc){
		if (err){
			req.session.error = "Sorry, invalid email & password"
			return res.redirect("/login");
		}

		if (!doc){
			req.session.error = "No account with that email"
			res.redirect("/signup");
		}else{
			if (crypto.checkPassword(doc.salt, _password, doc.password)){
				//Success!

				//TODO: Remove this line and add some "password prompts" to get password from user
				req.session.password = _password; // Used to decrypt data..

				if (doc.two_factor.enabled && true){
					//TODO: 2FA
					req.session.temp = {};
					req.session.temp.key = doc.two_factor.key;
					req.session.temp.user = doc;// Save that user object.. We're going to need it to log in!

					return res.redirect("/session/two-factor");
				}else{
					req.login(doc, function(err){
						if (err)
							throw new Error ("couldn't log in :(");

						req.session.last_authenticated = Date.now();
						res.redirect("/");
					});
				}
			}else{
				req.session.error = "Sorry, invalid email/username & password"
				res.redirect("/login");
			}
		}

	});

});

// Handle signup
/*
	The data to this handler should come from the form in "/views/pages/signup"
	the data should be as follows (name - description):
		username - Display name the user wants to use
		email - User's email address (must be unique)
		password - The password the user wants to use
		password_confirmation - The password again (should be exactly the same as password)
		t_and_c - Whether the user has accepted the terms and conditions or not
		q-recaptcha-response - The response from the captcha

	The first thing this handler does is checks the recaptcha response,
	if the recaptcha was successful, we call the signup function (sign the user up)
	otherwise, we tell them it was invalid and send them back to /signup.

	If the signup function was successful then we log the user in via req.login
*/
router.post("/signup", [isLoggedIn, upload.single("image")], function(req, result){
	//TODO: Handler user creation
	var key = req.body["g-recaptcha-response"];

	https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + config.captcha_secret + "&response=" + key, function(res) {

		var data = "";
		res.on('data', function (chunk) {
        	data += chunk.toString();
        });
        res.on('end', function() {
                try {
            		var parsedData = JSON.parse(data);
					console.log("Data: " + data);
                    if (parsedData.success){

						signUp(req.body, req.file, function(err, user){
							if (err){
								req.session.error = err;
								return result.redirect("/signup");
							}

							req.login(user, function(err){
								if (err)
									throw new Error(err);

								result.redirect("/");
							});
						});

					}else{
						req.session.error = "Invalid captcha";
						result.redirect("/signup");
					}
                } catch (e) {
                    //Assume they failed :(
					req.session.error = "Invalid captcha\n" + e;
					result.redirect("/signup");
                }
        });
	});
});

// Sign the user up!
/*
	This function is called from the /signup handler.
	We pass the req.body (POST data) and a function to call when completed.

	First thing we do is check if a user with the email exist...
	if they do, we call the next function with the error message "Email already taken", prompting the user to chosse another email.

	We then generate a UUID for the user's salt (it's easier just to use a library installed than writing something myself)
	We then create a new user object, setting the data to the data supplied.
		- The password is hashed with the salt
	We then save the user to the DB

	When everything was done successfully then we call the "next" function with the new user object created (to allow the user to log in)
*/
function signUp( data, file, next ){
	//They aren't a robot.... I hope... If they are the we have reached the singularity (or we have a smart bot on our hands) :O
	var _username = data.username;
	var _email = data.email;
	var _password = data.password;
	var _image = file;
	var _id = uuid();

	var fs = require("fs");
	var path = require("path");
	console.log("Set image: "+ JSON.stringify(_image));

	// If they post an image, upload it.
	if (_image){
		fs.readFile(_image.path, function(err, data){
			var newPath = path.join(__dirname, "../", "public", "images",
									_id + "." + file.originalname.split(".").pop());
			fs.writeFile(newPath, data, function(err){});
		});
	}

	mongo.getModel("User").findOne( {email: _email}, function(err, doc){
		if (err){
			return next(err);
		}
		if (doc){
			return next("Email already taken");
		}else{
			// No doc
			var salt = uuid();

			var User = new mongo.getModel("User")({
				id: _id,

				username: _username,
				nameId: _username + "#" + _id.substr(0,4),
				email: _email,
				salt: salt,
				password: crypto.hashPassword(salt, _password)
			});
			if(_image)
				User.profile.image = "/public/images/" + _id + "." + file.originalname.split(".").pop();

			User.save(function(err){
				if (err)
					return next(err);
				next(null, User);
			});
		}
	});
};

module.exports = router;
