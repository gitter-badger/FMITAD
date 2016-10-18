var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var Event = new Schema({

    id : {type: String, unique: true },
    owner: {type: String, unique: true}, // Only allow one event per person

    created_at: {type: Date, default: new Date(), index: true},

    platform: String, // e.g. Steam, Origin, UPlay
    /*
        To check if user has the platform do
            if (user[ event.platform ] && user[ event.platform ].id ){
                // They have it!
            }
    */

    /*
        What type of event is this? Can anyone join?
        Possible types:
            1 - Subsribers - Only allow subscribers join
            2 - Followers - Let followers (and subscribers) join
            3 - All - Let anyone apply

    */
    type: {type: Number, default: 2},

    details: {
        title: String,
        description: String
    }

});

Event.statics.generateId = function(){
    var uuid = require("uuid4");
    var id = uuid().replace(/-/g, "");
    return id.substr(0,16);
};

Event.methods.getOwner = function( cb ){
    this.model("User").findOne({id: this.owner}, "id username nameId", function(err, doc){
        if (err)
            return cb(err);

        if (!doc){
            return cb("No owner found with id '" + this.owner + "'");
        }

        return cb( null, doc.toObject() );
    });
};

module.exports = Event;
