var express = require("express");
var router = express.Router();

var config = require("../../config.json");
var mongo = require("../lib/mongo");
var crypto = require("../lib/cryptoHelper");
var uuid = require("uuid4");
var https = require("https");
var authenticator = require("authenticator");

function isLoggedIn(req, res, next){
	if (req.isAuthenticated())
		return res.redirect("/");
	next();//Only allow them to continue if they're not logged in
}

router.get("/signup", isLoggedIn, function(req, res){
	var e;
	if (req.session.error){
		e = req.session.error;
		delete req.session.error;
	}

	res.render("pages/signup", {
		error: e
	});
});

router.get("/login", isLoggedIn, function(req, res){
	var e;
	if (req.session.error){
		e = req.session.error;
		delete req.session.error;
	}

	res.render("pages/login", {
		error: e
	});
});

router.get("/session/two-factor", function(req, res, next){
	// session.temp shoud only be set when comming from /login 
	if (req.session.temp && req.session.temp.password && req.session.temp.key && req.session.temp.salt){
		return next();
	}

	res.redirect("/");
}, function(req, res){
	res.render("pages/account/two-factor");
});

router.post("/session/two-factor", function(req, res, next){
	if (req.session.temp && req.session.temp.password && req.session.temp.key && req.session.temp.salt){// Session = On server
		return next();
	}
	res.redirect("/");

}, function(req, res){
	if (!req.body.token){ // They haven't supplied a code... (Is this even possible?)
		console.log("No token :(");
		return res.render("pages/account/two-factor"); // Just send them that page again
	}
	var token = req.body.token;
	var password = req.session.temp.password;
	var key = req.session.temp.key;
	var salt = req.session.temp.salt;
	console.log("Temp: "+ JSON.stringify(req.session.temp));

	var auth = authenticator.verifyToken(key, token);

	if(auth){
		req.login(req.session.temp.user, function(err){
			if (err)
				throw new Error ("couldn't log in :(");

			delete req.session.temp; // Delete the temp data... We don't need it now
			console.log("Success 2fa");
			res.redirect("/");
		});
	}else{
		// Just silently fail and redirect them to the home page
		// Maybe log this attempt?
		res.redirect("/");
	}

});

router.post("/login", isLoggedIn, function(req, res){
	var _email = req.body.email;
	var _password = req.body.password;
	//console.log("Post Login: "+ _email + " ___ " + _password);
	mongo.getModel("User").findOne( {email: _email}, function(err, doc){
		if (err){
			req.session.error = "Sorry, invalid email/password"
			return res.redirect("/login");
		}

		if (!doc){
			req.session.error = "No account with that email"
			res.redirect("/signup");
		}else{
			if (crypto.checkPassword(doc.salt, _password, doc.password)){
				//Success!
				if (doc.two_factor.enabled && true){
					//TODO: 2FA
					req.session.temp = {};
					req.session.temp.password = _password;
					req.session.temp.salt = doc.salt;
					req.session.temp.key = doc.two_factor.key;
					req.session.temp.user = doc;
					//console.log("Securing 2fa");

					return res.redirect("/session/two-factor");
				}else{
					req.login(doc, function(err){
						if (err)
							throw new Error ("couldn't log in :(");

						res.redirect("/");
					});
				}
			}else{
				req.session.error = "Sorry, invalid email/password"
				res.redirect("/login");
			}
		}

	});

});

function signUp( data, next ){
	//They aren't a robot
	var _username = data.username;
	var _email = data.email;
	var _password = data.password;

	mongo.getModel("User").findOne({email: _email}, function(err, doc){
		if (err){
			return next(err);
		}
		if (doc){
			return next("Email already taken");
		}else{
			var salt = uuid();

			var User = new mongo.getModel("User")({
				id: uuid(),

				username: _username,
				email: _email,
				salt: salt,
				password: crypto.hashPassword(salt, _password)
			});

			User.save(function(err){
				if (err)
					return next(err);
				next(null, User);
			});
		}
	});
};

router.post("/signup", isLoggedIn, function(req, result){
	//TODO: Handler user creation
	var key = req.body["g-recaptcha-response"];

	//console.log("Got a POST request...: " + JSON.stringify(req.body));

	https.get("https://www.google.com/recaptcha/api/siteverify?secret=" + config.captcha_secret + "&response=" + key, function(res) {

		var data = "";
		res.on('data', function (chunk) {
        	data += chunk.toString();
        });
        res.on('end', function() {
                try {
            		var parsedData = JSON.parse(data);
					console.log("Data: " + data);
                    if (parsedData.success || true){

						signUp(req.body, function(err, user){
							if (err)
								throw new Error(err);

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


module.exports = router;
