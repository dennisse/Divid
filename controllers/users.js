
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User');

/**
 * Login
 */
exports.login = function(req, res) {
    res.render('login', {
        title: 'Login'
    });

}


/**
 * Logout
 */
exports.logout = function(req, res) {
    req.logout();
    res.resirect('/test');
}


/**
 * Signin
 * This is triggered when the user post to /login
 */
exports.signin = function(req, res) {}


/**
 * Signup
 */
exports.signup = function(req, res) {
        res.render('signup', { title: 'Registrer deg' });
}

/**
 * Create users
 */
exports.create = function(req, res) {
    var user = new User(req.body);
    user.provider = 'local';
    user.save(function(err) {
        if (err) return res.render('/signup', { errors: err.errors, user: user });
        req.logIn(user, function(err) {
            if (err) return next(err);
            return res.redirect('/dashboard');
        });
    });
}


/**
 * AuthCallback
 * This is what happends when a user has signed in using facebook/twitter
 */

exports.authCallback = function(req, res, next) {
    res.redirect('/dashboard');
}

