var mongoose = require("mongoose"),
    Schema = mongoose.Schema;

var User = new Schema({

    id : {type: String, unique: true }, //UUID4 format, allows for multiple people to have same username
    username : {type: String, unique: false}, //Turn to true if we don't want multiple people with same username...
    nameId: {type: String }, // {username}#{id(0,4)}
    email : {type: String, unique: true},

    salt: String, // Salt for hashing password with
    password: String, // Hashed ( password + salt )

    notifications: {type: Boolean, default: false},

    // Store the current cipher and hash algorithms to easily upgrade the algos used in future..
    crypto : {
        hash: {type: String, default: "sha512"},
        cipher: {type: String, default: "aes-256-cbc"}
    },

    currentEvent: String, // If they have an event started.. This will be it's ID

    isAdmin: {type: Boolean, default: false}, // Is this user an Admin?
    isMod: {type: Boolean, default: false}, // Is this user a Moderator?
    verified: Boolean, // Like twitter verified?

    following: [String],

    email_token: String,
    email_expires: Date,

    twitch: {
        id: String,
        username: String,
        token: String // Encrypted, same as "two_factor.key"
    },
    steam: {
        id: String,
        username: String
    },


    profile: {
        //Maybe implement this at somepoint?
        // I think it would be nice to have

        status: String, // Offline, Online, Invisible (Show offline to everyone except friends);
        image: String, // image location
        bio: {type: String}
    },

    two_factor: {
        enabled: {type: Boolean, default: false},  // Wether they have 2FA enabled or not
        key: String // The shared secret

        /*
            Since I'm not a security expert, I've decided not to allow Sms
            2FA because it would mean storing user's phone number
            and I can't be sure it's not going to be leaked..
            So, I'm just forcing them to use an APP instead as I don't have
            to store anything sensitive in the DB
        */
    }

});

User.virtual("profileImage").get(function(){
    return this.profile.image ? this.profile.image : "http://flathash.com/" + this.id;
});

User.methods.getTokenForPlatform = function( platform, plainPassword ){
    if (this[platform] && this[platform].token){
        // If they have a token..
        //Let's decrypt it
        var crypto = require("../app/lib/cryptoHelper");

        if (crypto.checkPassword( this.salt, plainPassword, this.password, this.crypto.hash)){

            var decrypted = crypto.decryptData(plainPassword + this.salt, this[platform].token, this.crypto.cipher );

            return decrypted;
        }else{
            return null;
        }

    }else{
        return null;
    }
};

module.exports = User;
