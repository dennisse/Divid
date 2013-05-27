// dependencies
var mongoose = require('mongoose')
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , TwitterStrategy = require('passport-twitter').Strategy
  , HashStrategy = require('passport-hash').Strategy
  , User = mongoose.model('User')
  , Access = mongoose.model('Access');

/**
 * This is where the magic happends
 */

module.exports = function (passport, config) {

    // serialize sessions
    passport.serializeUser( function(user, done) {
        done(null, user.id);
    });
    passport.deserializeUser( function(id, done) {
        User.findOne({ _id: id }, function(err, user) {
            done(err, user);
        });
    });


    /**
     * Local strategy
     */
    passport.use('local', new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function(email, password, done) {

        // looks up the user in the database, and check if password matches
        User.findOne({ email: email }, function(err, user) {
            if (err) return done(err);
            if (!user) return done(null, false, { message: 'Unknown user' });
            if (!user.authenticate(password)) return done(null, false, { message: 'Invalid password' });
            return done(null, user); // yay!
        });
    }));

    passport.use(new HashStrategy({ passReqToCallback: true }, function(req, hash, done) {
        Access.findOne({ randomToken: hash }, function(err, access) {
            if (err) return done(err);
            if (!access) return done(null, false, { message: 'Unknown link' });
            User.findOne({ _id: access.user }, function(err, user) {
                if (err) return done(err);
                if (!user) return done(null, false, { message: 'Unknown user' });
                return done(null, user); // yay!
            });
        });
    }));


    /**
     * Facebook strategy
     */
    passport.use(new FacebookStrategy({
        clientID: config.facebook.clientID
      , clientSecret: config.facebook.clientSecret
      , callbackURL: config.facebook.callbackURL
    }, function(accessToken, refreshToken, profile, done) {

        // looks up the user in the database. Will create the user if it does not exist
        User.findOne({ 'facebook.id': profile.id }, function(err, user) {
            if(err) return done(err);
            if (!user) {
                user = new User({
                    name: profile.displayName
                  , email: profile.emails[0].value
                  , username: profile.username
                  , provider: 'facebook'
                  , facebook: profile._json
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                return done(err, user);
            }
        });
    }));


    /**
     * Twitter strategy
     */
    passport.use(new TwitterStrategy({
        consumerKey: config.twitter.clientID
      , consumerSecret: config.twitter.clientSecret
      , callbackURL: config.twitter.callbackURL
    }, function(token, tokenSecret, profile, done) {

        // looks up the user in the database. Will create the user if it does not exist
        User.findOne({ 'twitter.id': profile.id }, function(err, user) {
            if (err) return done(err);
            if (!user) {
                user = new User({
                    name: profile.displayName
                  , username: profile.username
                  , provider: 'twitter'
                  , twitter: profile._json
                });
                user.save(function(err) {
                    if (err) console.log(err);
                    return done(err, user);
                });
            } else {
                return done(err, user);
            }
        });
    }));


}

