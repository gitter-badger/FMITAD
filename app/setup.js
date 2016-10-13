var cookieParser = require("cookie-parser"), // cookie helper :)
    session = require("express-session"), // sessions!!!
    helper = require("express-helpers"), // allows for extra js code in EJS files
    path = require("path"), // allows me to do stuff with directories!
    bodyParser = require("body-parser"), // parses POST and GET data into JSON format... I think
    MongoStore = require("connect-mongo")(session),
	config = require("../config.json"), // our config file, 1 dir up
    mongoUtil = require("./lib/mongo"); // Connect to the DB

module.exports = function ( app, express, passport ){

    app.set("port", process.env.PORT || config.listen_port || 80);
    //View engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    helper(app);

    app.use(session({
    	store: new MongoStore({
    		url: mongoUtil.getSessionUri(),
    		touchAfter: 24 * ( 60 * 60) // Only allow one update in 24hrs (unless session is changed)
    	}),
        secret : process.env.SECRET || "5c5b6c82-a57d-4150-aa22-6181c4b122f8",
        cookie: { maxAge: (60 * 60000) }, //After an hr of inactivity, session will expire
        resave: false,
        saveUninitialized: false
    }));// Set up sessions

    // setting up express
    app.use(express.static(path.join(__dirname, "public"))); // make sure it mounts the folders in /public
    app.use(cookieParser(process.env.SECRET || "5c5b6c82-a57d-4150-aa22-6181c4b122f8")); // use the cookie middleware

    app.use(bodyParser.json()); // allow us to recievv JSON data
    app.use(bodyParser.urlencoded( {extended: true} )); // I can't remember what this does.

    app.use(passport.initialize());
    app.use(passport.session());

    // Make sure we can access the user's data from EJS files.
    app.use(function(req, res, next){

        if (req.session.error){
    		res.locals.error = req.session.error;
    		delete req.session.error;
    	}
    	if (req.session.success){
    		res.locals.success = req.session.success;
    		delete req.session.success;
    	}
    	if (req.session.info){
    		res.locals.info = req.session.info;
    		delete req.session.info;
    	}

    	if (req.isAuthenticated()){ // Only do it they're logged in tho..
    		res.locals.user = req.user;

    		// Quick fix... Anyone who's registered and doesn't have a nameId set...
    		if (!req.user.nameId){
    			req.user.nameId = req.user.username +"#"+ req.user.id.substr(0,4);
    			req.user.save(function(err){}); // Set it and save
    		}
    	}
    	next();
    });

    //Phew! The app is set up now
};
