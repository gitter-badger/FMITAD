var express = require("express"); // website framework

var passport = require("passport");
var app = express();

require("./setup.js")(app, express, passport);
require("./lib/passportHelper")(passport);

//Defined routes.
app.use("/", require("./routes/index")); // Our "/" routes
app.use("/", require("./routes/auth")); // Handle "/login", "/signup" and "/session/two-factor"
app.use("/api", require("./routes/api")); // Our "/api" routes
app.use( [/*"/account",*/ "/profile"], require("./routes/account")); // Our "/account" routes
app.use("/events", require("./routes/events"));

if (app.get("env") === "development"){
	app.use("/dev", require("./routes/dev"));
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
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
	console.log("Sending an error...");
    res.status(err.status || 500);
    res.render('pages/error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
