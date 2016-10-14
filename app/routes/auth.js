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

var nodemailer = require('nodemailer');
var transport = nodemailer.createTransport({
    service: "SendGrid",
    auth:{
        user: config.email.user,
        pass: config.email.password
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
            res.redirect(req.get("Referer") || "/");
        });
    }
});

// Show the signup form for the user to fill out.
// The actual signup logic is in the POST handler
router.get("/signup", isLoggedIn, function(req, res){
    res.render("pages/auth/signup");
});

// Show the login form for the user to fill out
// Actual logic is in the POST handler
router.get("/login", isLoggedIn, function(req, res){
    console.log("Login locals: " + JSON.stringify(res.locals));
    res.render("pages/auth/login");
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
    var key = crypto.decryptData(req.session.password + req.session.temp.user.salt, req.session.temp.key, req.session.temp.user.crypto.cipher );

    console.log("Temp: "+ key);

    var auth = authenticator.verifyToken(key, token);

    if(auth){
        req.login(req.session.temp.user, function(err){
            if (err)
                throw new Error ("couldn't log in :(");

            delete req.session.temp; // Delete the temp data... We don't need it now

            req.session.last_authenticated = Date.now();
            res.redirect(req.get("Referer") || "/");
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
            // If email hasn't been confirmed and the epirydate is the past (not expired)
            if(doc.email_token){
                if (doc.email_expires > Date.now()){
                    req.session.error = "Please confirm your email address";
                    return res.redirect("/login");
                }else{
                    // email token has expired... Delete the account.
                    doc.remove(function(err){ console.log("Removed un-confirmed account"); });
                    return res.redirect("/signup");
                }
            }

            console.log("Loggin in: " + JSON.stringify(doc.crypto));

            if (crypto.checkPassword(doc.salt, _password, doc.password, doc.crypto.hash )){
                //Success!

                // If we've changed our crypto algorithms since the last time the user has logged in,
                // implement the new algorithms (decrypt current data and re-encrpt)
                crypto.implementNewAlgos(_password, doc); // The method won't run if the user's algorithms match the algorithms in config.json

                //TODO: Remove this line and add some "password prompts" to get password from user?
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
                            return res.render("pages/index", {error: "Couldn't log in :("});

                        req.session.last_authenticated = Date.now();
                        res.redirect(req.get("Referer") || "/");
                    });
                }
            }else{
                req.session.error = "Sorry, invalid email & password"
                res.redirect("/login");
            }
        }

    });

});

router.get("/email/:type", function(req, res){
    var fs = require("fs");
    var util = require("util");
    var path = require("path");

    console.log(JSON.stringify(req.user));
    var user = req.user;

    var confirmHtml = fs.readFileSync(path.join(__dirname, "../", "../", "email", req.params.type ), {encoding: "utf8"});
    var formattedHtml = util.format(confirmHtml);
    //console.log(formattedHtml);

    transport.sendMail({
        html: formattedHtml,
        to: user.email,
        from: '"Support FMITAD" <support@fmitad.com>',
        subject: "Test email - FMITAD"
    }, function(err){
        if(err)
            console.log("Error sending message: " +err);
    });

    res.send("Done!");

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

                            var fs = require("fs");
                            var util = require("util");
                            var path = require("path");

                            var confirmLink = "http://localhost/confirm/" + user.email_token;

                            var confirmHtml = fs.readFileSync(path.join(__dirname, "../", "../", "email", "register.html"), {encoding: "utf8"});
                            var formattedHtml = util.format(confirmHtml, user.username, confirmLink, confirmLink);
                            //console.log(formattedHtml);

                            transport.sendMail({
                                html: formattedHtml,
                                to: user.email,
                                from: '"Support FMITAD" <support@fmitad.com>',
                                subject: "Confirmation email - FMITAD"
                            }, function(err){
                                if(err)
                                    console.log("Error sending message: " +err);
                            });

                            result.render("pages/index", {success: "We've sent an email from support@fmitad.com to confirm your email. You have 24 hours."});
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

router.post("/profile/update-basic", upload.single("image"), function(req, res){
    var uname = req.body.username;
    var email = req.body.email;

    var _image = req.file;
    var notifs = req.body["notif-checkbox"];

    console.log("Notifs: " + notifs);

    var fs = require("fs");
    var path = require("path");

    if (_image){
        // Save the image they want to upload
        fs.readFile(_image.path, function(err, data){
            var newPath = path.join(__dirname, "../", "public", "images",
                                    req.user.id + "." + _image.originalname.split(".").pop());
            fs.writeFile(newPath, data, function(err){});
        });

        req.user.profile.image = "/images/" + req.user.id + "." + _image.originalname.split(".").pop();
    }

    if (uname != req.user.username){
        // Update the username
        req.user.username = uname;
        //Username has changed.. We need to re-create their nameId
        req.user.nameId = uname + "#" + req.user.id.substr(0,4);
    }
    if (email != req.user.email){
        //Update the email
        req.user.email = email;
    }

    if (notifs === "on"){
        req.user.notifications = true;
    }else{
        req.user.notifications = false;
    }

    req.user.save(function(err){
        if(err){
            req.session.error = err;
            return res.redirect("/profile");
        }

        req.session.success = "Successfully updated profile";
        res.redirect("/profile");
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
            var salt = uuid().replace(/-/g, ""); // 32 character random string (i think it's 32)
            var algos = crypto.getAlgorithms();

            //Salt is now a string of alpha-numeric characters with a length between 16 and 32 characters
            salt = salt.substr(0, Math.floor(Math.random() * ( (salt.length) - (salt.length/2)) + (salt.length/2) ) );

            var User = new mongo.getModel("User")({
                id: _id,

                username: _username,
                nameId: _username + "#" + _id.substr(0,4),
                email: _email,
                salt: salt,
                password: crypto.hashPassword(salt, _password, algos.hash)
            });
            if(_image)
                User.profile.image = "/images/" + _id + "." + file.originalname.split(".").pop();

            User.email_token = uuid().replace(/-/g, "");

            User.crypto.hash = algos.hash;
            User.crypto.cipher = algos.cipher;

            var tmpDate = new Date();
            tmpDate.setHours(tmpDate.getHours() + 24);

            User.email_expires = tmpDate; // email token expires in 24 hrs.

            User.save(function(err){
                if (err)
                     return next(err);
                 next(null, User);
             });
        }
    });
};

module.exports = router;
