
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , crypto = require('crypto')
  , authTypes = ['facebook', 'twitter'];


/**
 *  User schema
 */

var UserSchema = new Schema({
    name: String,
    email: String,
    username: String,
    provider: String,
    hashed_password: String,
    salt: String,
    accessToken: String,
    facebook: {},
    twitter: {}
});

/**
 * Virtuals
 */

UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password
    this.salt = this.makeSalt()
    this.hashed_password = this.encryptPassword(password)
  }).get(function() { return this._password });

/**
 *  Validations
 */
var validatePrecenceOf = function (value) {
    return value && value.length;
}

// the four validations below only apply if you are signing up traditionally

UserSchema.path('name').validate(function(name) {
    // if you're authenticated by any of the oauth strategies (facebook, twitter), don't validate
    if(authTypes.indexOf(this.provider) !== -1) return true;
    return name.length;
}, 'Name cannot be blank');

UserSchema.path('email').validate(function(email) {
    if(authTypes.indexOf(this.provider) !== -1) return true;
    return email.length;
}, 'Email cannot be blank');

UserSchema.path('username').validate(function(username) {
    if(authTypes.indexOf(this.provider) !== -1) return true;
    return username.length;
}, 'Username cannot be blank');

UserSchema.path('hashed_password').validate(function(hashed_password) {
    if(authTypes.indexOf(this.provider) !== -1) return true;
    return hashed_password.length;
}, 'Password cannot be blank');

/**
 * Pre-save hook
 */

UserSchema.pre('save', function(next) {
    if (!this.isNew) return next();

    if(!validatePrecenceOf(this.password)
      && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else next();
});


/**
 * Methods
 */

UserSchema.methods = {

   /**
    * Authenticate - check if passwords are the same
    *
    * @param {String} plainText
    * @return {Bolean}
    * @api public
    */

    authenticate: function(plainText) {
        return this.encryptPassword(plainText) === this.hashed_password;
    },


   /**
    * Make salt
    *
    * @return {String}
    * @api public
    */

    makeSalt: function() {
        return Math.round((new Date().valueOf() * Math.random())) + '';
    },


   /**
    * Encrypt password
    *
    * @param {String} password
    * @return {String}
    * @api public
    */

    encryptPassword: function(password) {
        if (!password) return '';
        return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
    },


   /**
    * Generate random access token for Remember Me function
    *
    * @return {String}
    * @api public
    */

    generateRandomToken: function() {
        var chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
          , token = new Date().getTime() + '_';
        for (var i = 0; i < 16; i++) {
            var x = Math.floor(Math.random() * 62);
            token += chars.charAt(x);
        }
        return token;
    }
}

mongoose.model('User', UserSchema);

