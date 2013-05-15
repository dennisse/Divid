
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Project = mongoose.model('Project')
  , Access = mongoose.model('Access')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config')[env]
  , Validator = require('validator').Validator
  , v = new Validator()
  , sanitize = require('validator').sanitize;

// validation error handling. This collects all errors before pushing them out in getErrors()
Validator.prototype.error = function(msg) {
    this._errors.push(msg);
    return this;
}
Validator.prototype.getErrors = function() {
    var returnThis = this._errors;
    this._errors = ''; // need to reset errors between sessions because of object model
    return returnThis;
}


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
    res.redirect('/test');
}


/**
 * Signin
 * This is triggered when the user post to /login
 */
exports.signin = function(req, res) {
    res.redirect('/dashboard');
}


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
        if (err) return res.render('signup', { errors: err.errors, user: user });
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
    // if the user hasn't registered an email, we need to do so
    if (!req.user.email || req.user.email === 'undefined') return res.redirect('/registerEmail');

    res.redirect('/dashboard');
}


/**
 * postProjectParticipants
 * This callback is in this file because it treats users.
 */
exports.postProjectParticipants = function(req, res) {
    Project.loadShort(req.params.short, function(err, project) {
        if (err || !project) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

        Access.checkAccess(req.user._id, project._id, 3, function(err, access) {
            if (err || !access) return res.status(403).render('error', { title: '403', text: 'No sir! NO ACCESS FOR YOU', error: err });

            // validate
            var emails = sanitize(req.body.emails).xss();
            v.check(emails, 'You need to enter some emails to invite someone').notEmpty();
            //var emails = sanitize(req.body.emails).xss();
            emails = emails.split('\r\n');
            emails.forEach(function(m) { // m = each mailaddress
                if (m) v.check(m, m + ' is not a valid email').isEmail();
            });

            // error when validation fails
            var errors = v.getErrors();
            if (errors.length !== 0) return res.status(500).render('error', { title: '500', text: 'Det oppstod en valideringsfeil<br>' + errors, error: errors });

            // EMAIL
            // Require dependencies. We require them here so that they're not fetched until they're actually needed.
            var email = require('emailjs')
              , server = email.server.connect(config.email)
              , message = {
                subject:    'You were invited to use Divid',
                text:       'VIL DU BRUK DIVID?',
                from:       'Divid <divid@divid.no>',
            }

           emails.forEach(function(mailAddress) { // loops through all the emails and sets up each user
                User.loadUser(mailAddress, function(err, user) {
                    if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
                    if (!user) { //if the user doesn't exist, create one
                        console.log('fant ingen brukere med den eposten. må invitere og stasj');
                        var newUser = new User();
                        newUser.email = mailAddress;
                        newUser.status = 1;
                        newUser.password = newUser.generateRandomToken(32);
                        newUser.save(function(err) {
                            if (err) return res.render('projectParticipants', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
                            console.log('made new user ' + newUser._id);
                            var access = new Access();
                            access.user = newUser._id;
                            access.creator = req.user._id;
                            access.project = project._id;
                            access.save(function(err) {
                                if (err) {
                                    console.log(err.errors);
                                    return res.render('projectParticipants', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
                                }
                                console.log('made new access for user ' + newUser._id);
                                message.to = newUser.email;
                                message.text = 'Du ble lagt til projektet "' + project.name + '"';
                                server.send(message, function(err, message) { console.log(err || message);});
                            });
                        });


                        message.to = newUser.email;
                        message.text = 'Hei hå';
                        server.send(message, function(err, message) { console.log(err || message);});
                    } else { // if the user exists, add him to the project
                        Access.checkAccess(user._id, project._id, 0, function(err, acc) {
                            if (err) return res.render('projectParticipants', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
                            if (acc) { // if the user already has access to the project.. do nothing
                                console.log('user ' + user.email + ' already has access to project ' + project.name);
                            } else {
                                console.log('fant en bruker. må lage ny access til han og si i fra.');
                                var access = new Access();
                                access.user = user._id;
                                access.creator = req.user._id;
                                access.project = project._id;
                                access.save(function(err) {
                                    if (err) {
                                        console.log(err.errors);
                                        return res.render('projectParticipants', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
                                    }
                                    console.log('made new access for user ' + user.username);
                                    message.to = user.email;
                                    message.text = 'Du ble lagt til projektet "' + project.name + '"';
                                    server.send(message, function(err, message) { console.log(err || message);});
                                });
                            }
                        });
                    }
                });
           });

            res.redirect('back');
        });
    });
}


