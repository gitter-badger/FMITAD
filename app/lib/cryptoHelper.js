//JS file to help with cryptography related stuff..
var crypto = require("crypto");
var cipherAlgo = "aes-256-cbc";
var hashAlgo = "sha512";

var Helper = {};

/*
	Encrypts the user's salt with their plaintext password.

	I was going to use this to add extra security to the user's account by encrypting their salt.
	E.g.
		When user signs up
			- Generate salt
			- Encrypt salt with password
			- Store encrypted salt in DB
*/
Helper.encryptSalt = function(password, salt){
	var cipher = crypto.createCipher(cipherAlgo, password);

	var r = cipher.update(salt, "utf8", "hex");
	r += cipher.final("hex");

	return r;
};

/*
	Decrypts the user's salt with their plaintext password.

	I was going to use this to add extra security to the user's account
	E.g.
		When user logs
			- Get encrypted salt
			- Decrypt the salt using the password supplied
			- Check the plaintext password against the stored password
				- Hash the supplied password with the decrypted salt
*/
Helper.decryptSalt = function(password, ciphertext){
	var cipher = crypto.createDecipher(cipherAlgo, password);

	var r = cipher.update(ciphertext, "hex",  "utf8");
	r += cipher.final("utf8");

	return r;
};

// Hashes the password with the supplied salt then hashed password as a hex string.
Helper.hashPassword = function(salt, password){
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
Helper.checkPassword = function(salt, plainpass, cipherpass){
	var hash = crypto.createHash(hashAlgo);
	hash.update(salt + plainpass);
	var pass = hash.digest("hex");
	return pass == cipherpass;
};

// Encrypts the plaintext data with the given password
// returns a string in hex format of the ciphertext
Helper.encryptData = function( password, plaintext ){
	var cipher = crypto.createCipher(cipherAlgo, password);

	var r = cipher.update(plaintext, "utf8", "hex");
	r += cipher.final("hex");

	return r;
};

// Decrypts the ciphertext data with the given password
// returns a string in utf8 format of the plaintext
Helper.decryptData = function( password, ciphertext ){
	var cipher = crypto.createDecipher(cipherAlgo, password );

	var r = cipher.update(ciphertext, "hex",  "utf8");
	r += cipher.final("utf8");

	return r;
};

module.exports = Helper;
