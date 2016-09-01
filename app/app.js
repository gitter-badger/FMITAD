var express = require("express"), // website framework
    cookieParser = require("cookie-parser"), // cookie helper :)
    session = require("express-session"), // sessions!!!
    helper = require("express-helpers"), // allows for extra js code in EJS files
	path = require("path"), // allows me to do stuff with directories!
    bodyParser = require("body-parser"), // parses POST and GET data into JSON format... I think
	config = require("../config.json"); // our config file, 1 dir up

var app = express();
var server = require('http').Server(app);

app.set("port", process.env.PORT || config.listen_port || 80);
//View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
helper(app);

// setting up express
app.use(express.static(path.join(__dirname, "public"))); // make sure it mounts the folders in /public
app.use(cookieParser()); // use the cookie middleware
app.use(bodyParser.json()); // allow us to recievv JSON data
app.use(bodyParser.urlencoded( {extended: true} )); // I can't remember what this does.
app.use(session({
    secret : process.env.SECRET || "5c5b6c82-a57d-4150-aa22-6181c4b122f8",
    cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
}));

//Defined routes.
var rootRoute = require("./routes/index");
app.use("/", rootRoute);

var apiRoute = require("./routes/api");
app.use("/api", apiRoute);

// Start listening on the specified port
server.listen(app.get("port"), function(){
	console.log("Server listening on port: " + app.get("port"));
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
	console.log("Sending an error...");
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('pages/error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('pages/error', {
        message: err.message,
        error: {}
    });
});
