// TODO: Put /api/ handlers in here
var express = require("express");
var router = express.Router();
var passport = require("passport");
var mongo = require("../lib/mongo");

function authOnly(req, res, next){
    if (req.isAuthenticated() || req.xhr || true)
        return next();

    res.status(403).send({
        "error": "Unauthorized",
        "message": "You are not allowed to access this"
    });
};

function modOnly(req, res, next){
    if (req.user.isMod || req.user.isAdmin)
        return next();

    res.status(403).send({
        "error": "Unauthorized",
        "message": "You are not allowed to access this"
    });
};

function adminOnly(req, res, next){
    if(req.user.isAdmin)
        return next();

    res.status(403).send({
        "error": "Unauthorized",
        "message": "You are not allowed to access this"
    });
};

router.use(authOnly); // Only allow authenticated user to access /api :D


/*
##########################
#	Routes for everyone  #
##########################
*/

// verify that the user has authorized the application, then redirect to the previous page or /account
// If they already authorized, then boot them back
router.get("/steam/verify", function(req, res, next){
    if (req.user.steam.id)
        return res.redirect(req.get("Referer") || "/");
    next();
}, passport.authorize("steam", {
    failureRedirect: "/"
}), function (req, res){
    res.redirect(req.get("Referer") || "/profile#platforms"); // Success :D
});

// verify that the user has authorized the application, then redirect to the previous page or /account
router.get("/twitch/verify", function(req, res, next){
    if (req.user.twitch.id)
        return res.redirect(req.get("Referer") || "/");
    next();
}, passport.authorize("twitch", {
    failureRedirect: "/"
}), function(req, res){
    res.redirect(req.get("Referer") || "/profile#platforms"); // Success :D
});

router.get("/steam/delete", function(req, res){
    req.user.steam = {}; // Set it to an empty object (remove it)
    req.user.save(function(_err){
        return res.redirect(req.get("Referrer") || "/profile#platforms");
    });
});

router.get("/twitch/delete", function(req, res){
    req.user.twitch = {};
    req.user.save(function(_err){
        return res.redirect(req.get("Referer") || "/profile#platforms");
    });
});

/*
    Because MongoDB doesn't have an effective pagnation system, we have to
    do some clever stuff.. We could use the .skip() function but, it's not scalable :(
    So, let's do some stuff!!!

    The field "created_at" should be indexed so, limiting should be relatively fast.. I hope

    Example query:
        /events/all?lastCreated={DATE}

*/
router.get("/events/all", function(req, res){

    var lastCreated = req.query.lastCreated;

    if (lastCreated){
        console.log("Checking if dates are greater than " + lastCreated);
        mongo.getModel("Event").find({ created_at: { $gt: lastCreated } }, "id owner platform type details created_at", {
            limit: 9,
            sort:
                {
                    created_at: 1
                }
        }, function(err, events){
            var data = {};
            if (err)
                data.error = err;

            data.events = events;

            res.send(data);
        });
    }else{

        mongo.getModel("Event").find({ }, "id owner platform type details created_at", {
            limit: 9,
            sort:
                {
                    created_at: 1
                }
        }, function(err, events){
            var data = {};
            if (err)
                data.error = err;

            data.events = events;

            res.send(data);
        });

    }


});


/*
    API to search for users who have an ID, Username or nameId value supplied.

    If user(s) are found matching the creteria, return them.
    otherwise, return some empty arrays (error messages handled client-side)
*/
router.get("/search-user", function(req, res, next){
    // The query passed to this can represent the following data:
    //		- nameId
    // 		- username
    //		- id
    var q = JSON.stringify(req.query.q);
    if (!q || q == "" || q == " ") {
        console.log("No q");
        return res.send([]);
    }

    q = q.replace(/%23/g, '#');

    var reg = new RegExp("^" + q , "i");

    mongo.getModel("User").find({
        $or: [
            {nameId: { $regex: new RegExp("^" + q + "$", "i") }},
            {username: { $regex: reg }},
            {id: { $regex: reg }}
        ]
    }, "username profileImage id nameId profile",{
        sort: {
            username: 1
        }
    }, function(err, docs){
        var users = [];
        if (err){
            console.log("Error searching users: " + err);
            return res.send([]);// Just send an empty array.. Tell them no-one was found :(
        }

        for(var i = 0; i < docs.length; i++){
            users.splice(i, 0, docs[i].toObject());
            users[i].profileImage = docs[i].profileImage;
        }

        console.log("Sending:\n" + JSON.stringify(users) + "\n\n");

        res.send(users);
    });
});

router.post("/two-factor", function(req, res){
    var crypto = require("../lib/cryptoHelper");
    var authenticator = require("authenticator");

    var password = req.session.password;

    var isCorrect = crypto.checkPassword( req.user.salt, req.session.password, req.user.password, req.user.crypto.hash );

    if (isCorrect){

        var key = crypto.decryptData(req.session.password + req.user.salt, req.user.two_factor.key, req.user.crypto.cipher );

        var uri = authenticator.generateTotpUri(
            key, req.user.username, "FMITAD",
            "SHA1", 6, 30);

        res.send({
            "success": true,
            "key" : key,
            "uri" : uri
        });

    }else{
        res.send({
            "success": false,
            "error": "Incorrect password.. Cannot decrypt data"
        })
    }

});

/*
########################################################################
    DEBUG ROUTES BELOW
    DELETE WHEN DONE DEVELOPING/DEBUGGING
    SERIOUSLY, YOU DON'T WANT USERS TO ACCESS THE BELOW
########################################################################
*/

router.get("/off/:id", function(req, res){
    mongo.getModel("User").findOne( {id: req.params.id}, function(err, doc){
        doc.two_factor.enabled = false;
        doc.save(function(err){
            res.send({
                error: err,
                saved: true
            });
        });
    });
});

function generateUser(_username, _email, _password){
    var crypto = require("../lib/cryptoHelper");
    var uuid = require("uuid4");

    mongo.getModel("User").findOne( {email: _email}, function(err, doc){
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
                throw err;
            console.log("Saved user: " + User.id);
        });

    });
}
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateEvent(){
    var uuid = require("uuid4");

    var id = uuid().substr(0,8);
    var owner = uuid();
    var createdDate = randomDate(new Date(2015, 0, 1), new Date());
    var plat = "Steam";
    var title = "Event " + id.substr(0,4);
    var desc = "Event for owner " + owner.substr(0,4) + " with the id of " + id.substr(0,4);

    var EM = mongo.getModel("Event");

    var e = new EM({
        id: EM.generateId(),
        owner: owner,
        created_at: createdDate,
        platform: plat,

        details: {
            title: title,
            description: desc
        }
    });

    console.log("Saved: " + JSON.stringify(e));


    e.save(function(err){
        if(err)
            console.log("Error saving random generated event: " + err);
    });
}

router.get("/delete-events", function(req, res){
    var m = mongo.getModel("Event");

    m.find({}, function(err, docs){
        docs.forEach(function(doc){
            doc.remove();
        });
        res.redirect("/events");
    });
});

router.get("/add-events/:amount", function(req, res){
    var amount = req.params.amount;


    for(var i = 0; i< amount; i++){
        generateEvent();
    }

    res.redirect("/events");
});

router.get("/add-users/:amount", function(req, res){
    var amount = req.params.amount;
    var uuid = require("uuid4");

    var users = [];
    for(var i = 0; i< amount; i++){
        var username = "test_" + uuid().substr(0,8);
        var email = username + "@test.com";
        var password = "test123";
        generateUser(username, email, password);

        users.push ( {username: username, email: email} );
    }

    res.send(users);

});

router.get("/dump-session", function(req, res){
    res.send(req.session);
});

router.get("/set-data/:password", function(req, res){
    var pass = req.params.password;
    var data = req.user.two_factor.key;
    var crypto = require("../lib/cryptoHelper");

    console.log("Encrypting: " + data);
    console.log("With password: "+ pass);

    var ciphertext = crypto.encryptData(pass + req.user.salt, data);

    console.log("Encrypted: " +ciphertext);
    res.redirect("/api/get-data/" + pass + "?data=" + ciphertext);
});

router.get("/get-data/:password", function(req, res){
    var pass = req.params.password;
    var data = req.query.data;
    var crypto = require("../lib/cryptoHelper");

    console.log("Decrypting: " + data);
    console.log("With password: "+ pass);

    var plaintext = crypto.decryptData(pass + req.user.salt, data);

    console.log("Plaintext: " +plaintext);

    res.send(plaintext);
});

router.get("/model/:model", function(req, res){
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

router.get("/users", function(req, res){
    var mongo = require("../lib/mongo");
    var m = mongo.getModel("User");

    m.find({}, function(err, docs){
        if (err)
            return res.send("Error: " +err);
        var users = [];

        for(var i = 0; i < docs.length; i++){
            users.splice(i, 0, docs[i].toObject());
            users[i].profileImage = docs[i].profileImage;
        }

        console.log(JSON.stringify(users));

        res.send(users);
    });

});

router.get("/users/delete/:id", function(req, res){
    var mongo = require("../lib/mongo");
    var m = mongo.getModel("User");

    m.find({id: req.params.id}, function(err, docs){
        docs.forEach(function(doc){
            doc.remove();
        });
        res.redirect("/api/users");
    });
});

router.get("/users/delete/", function(req, res){
    var mongo = require("../lib/mongo");
    var m = mongo.getModel("User");

    m.find({}, function(err, docs){
        docs.forEach(function(doc){
            doc.remove();
        });
        res.redirect("/api/users");
    });
});

module.exports = router;
