//JS file to help with cryptography related stuff..
var crypto = require("crypto");
var conf = require("../../config.json");

var latestCipher = conf.cryptography.cipherAlgo;
var latestHash = conf.cryptography.hashAlgo;

var Helper = {};

Helper.getAlgorithms = function(){
    return {
        "cipher" : latestCipher,
        "hash" : latestHash
    };
};

Helper.implementNewAlgos = function(plainpass, userObj){
    console.log("Current Algorithms:\n\tHash: %s\n\tCipher: %s", userObj.crypto.hash, userObj.crypto.cipher);
    console.log("Latest: \n\tHash: %s\n\tCipher: %s", latestHash, latestCipher);

    if (userObj.crypto.hash == latestHash &&
        userObj.crypto.cipher == latestCipher ){
        return; // No need to change anything... They're using the latest algo
    }

    if (userObj.crypto.hash != latestHash){
        //Re-hash their plain password
        userObj.password = Helper.hashPassword(userObj.salt, plainpass, latestHash );
        userObj.crypto.hash = latestHash; // Update the algorithm used in DB
    }

    if (userObj.crypto.cipher != latestCipher){
        var oldCipher = userObj.crypto.cipher;

        for (var i = 0; i < conf.cryptography.encryptedDataArray.length; i++){
            var key = conf.cryptography.encryptedDataArray[i];
            var keys = key.split(".");

            if (keys.length == 1){
                // Just the one (e.g user.password)
                if (typeof userObj[key] == "undefined"){
                    console.log("Skipping %s because it doesn't exist", key);
                    continue;
                }else{
                    var decryped = Helper.decryptData( plainpass + userObj.salt, userObj[key], oldCipher);
                    //console.log("Decrypted: " + key + " \n\t " + decryped);

                    var newEncrypted = Helper.encryptData(plainpass + userObj.salt, decryped, latestCipher);
                    //console.log("Encrypted : " + key + " \n\t " + newEncrypted);

                    userObj[key] = newEncrypted;
                    //console.log("Updated userObj");
                }
            }else if(keys.length == 2){

                var data = userObj[keys[0]][keys[1]];
                if (typeof data == "undefined"){
                    console.log("Skipping %s because it doesn't exist", key);
                    continue;
                }

                //console.log("%s exists!\nIt's %s using %s", key, data, oldCipher);

                var decryped = Helper.decryptData( plainpass + userObj.salt, data, oldCipher);
                //console.log("Decrypted: " + key + " \n\t " + decryped);

                var newEncrypted = Helper.encryptData(plainpass + userObj.salt, decryped, latestCipher);
                //console.log("Encrypted : " + key + " \n\t " + newEncrypted);

                userObj[keys[0]][keys[1]] = newEncrypted;
                //console.log("Updated userObj")

            }else{
                console.log("ERROR: Sorry, I cannot re-encrypt data that is more than 1 layer deep (more than one dot)");
                return;
            }
        }

        userObj.crypto.cipher = latestCipher;
    }

    userObj.save(function(err){
        if (err)
            console.log("Error saving new algo-data: " + err);
    });
};

// Hashes the password with the supplied salt then hashed password as a hex string.
Helper.hashPassword = function(salt, password, hashAlgo){
    var hash = crypto.createHash(hashAlgo);
    hash.update(salt + password);
    return hash.digest("hex");
};
/*
    Check a plaintext password is the same as the cipherpass.
    What this function should do:
        Hash the plaintext password with the given salt,
        check that the hashed password is the same as cipherpass supplied
*/
Helper.checkPassword = function(salt, plainpass, cipherpass, hashAlgo){
    var hash = crypto.createHash(hashAlgo);
    hash.update(salt + plainpass);
    var pass = hash.digest("hex");
    console.log("checkPassword: " + hashAlgo + "\n" + pass + "\n" + cipherpass);
    return pass == cipherpass;
};

// Encrypts the plaintext data with the given password
// returns a string in hex format of the ciphertext
Helper.encryptData = function( password, plaintext, cipherAlgo ){
    var cipher = crypto.createCipher(cipherAlgo, password);

    var r = cipher.update(plaintext, "utf8", "hex");
    r += cipher.final("hex");

    return r;
};

// Decrypts the ciphertext data with the given password
// returns a string in utf8 format of the plaintext
Helper.decryptData = function( password, ciphertext, cipherAlgo ){
    var cipher = crypto.createDecipher(cipherAlgo, password );

    var r = cipher.update(ciphertext, "hex",  "utf8");
    r += cipher.final("utf8");

    return r;
};

module.exports = Helper;
