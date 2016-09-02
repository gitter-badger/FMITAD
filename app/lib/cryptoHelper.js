var crypto = require("crypto");

var cipherAlgo = "aes-256-cbc";
var hashAlgo = "sha512";

var Helper = {};


Helper.encryptSalt = function(password, salt){
	var cipher = crypto.createCipher(cipherAlgo, password);

	var r = cipher.update(salt, "utf8", "hex");
	r += cipher.final("hex");

	return r;
};

Helper.decryptSalt = function(password, ciphertext){
	var cipher = crypto.createDecipher(cipherAlgo, password);

	var r = cipher.update(ciphertext, "hex",  "utf8");
	r += cipher.final("utf8");

	return r;
};

Helper.hashPassword = function(salt, password){
	var hash = crypto.createHash(hashAlgo);
	hash.update(salt + password);
	return hash.digest("hex");
};

Helper.checkPassword = function(salt, plainpass, cipherpass){
	var hash = crypto.createHash(hashAlgo);
	hash.update(salt + plainpass);
	var pass = hash.digest("hex");
	return pass == cipherpass;
};

module.exports = Helper;
