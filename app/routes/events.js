// mounted at /events
var express = require("express"),
    router = express.Router(),
    mongo = require("../lib/mongo");

function ensureAuth(req, res, next){
    if (req.isAuthenticated())
        return next();

    res.redirect(req.get("Referrer") || "/");
};

router.get("/", function(req, res){
    res.render("pages/events/index");
});

router.get("/create", ensureAuth, function(req, res){
    var notice;
    if (req.user.currentEvent){
        notice = "Doing this will remove your <a href='/events/" + req.user.currentEvent + "'>current event</a>";
    }

    res.render("pages/events/create", {info: notice} );
});

router.post("/create", ensureAuth, function(req, res){

    var platform = escape(req.body.platform);
    var type = escape(req.body.eventType);
    var title = escape(req.body.title.substr(0, 50));
    var description = escape(req.body.description);
    var owner = req.user.id;

    type = (type < 4 && type > 0) ? type : 2;// Make sure it's our values.
    // If it's not. Set it to the default value.

    var eventSchema = mongo.getModel("Event");

    //Delete any old events
    if (req.user.currentEvent){
        eventSchema.findOneAndRemove({id: req.user.currentEvent}, function(err, deletedEvent){
            if(err){
                req.session.error = "Couldn't delete old event: " + err;
                return res.redirect("/events/create");
            }

            var e = createEvent(eventSchema, owner, platform.toLowerCase(), type, title, description);

            e.save(function(err){
                if (err){
                    req.session.error = "Couldn't create the event: " + err;
                    return res.redirect("/events/create");
                }

                req.user.currentEvent = e.id;
                req.user.save(function(_err_){});

                res.redirect("/events/");
            });
        });
    }else{
        var e = createEvent(eventSchema, owner, platform.toLowerCase(), type, title, description);

        e.save(function(err){
            if (err){
                req.session.error = "Couldn't create the event: " + err;
                return res.redirect("/events/create");
            }

            req.user.currentEvent = e.id;
            req.user.save(function(_err_){});

            res.redirect("/events");
        });
    }

});


function createEvent( eventSchema, owner, platform, type, title, description ){
    return new eventSchema({
        id: eventSchema.generateId(),
        owner: owner,
        platform: platform,
        type: type,

        details: {
            title: title,
            description: description
        }
    });
}

function escape(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}



module.exports = router;
