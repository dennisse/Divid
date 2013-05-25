
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , Project = mongoose.model('Project')
  , Access = mongoose.model('Access')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
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
 * Logout
 */
exports.logout = function(req, res) {
    req.logout();
    res.redirect('/');
}


/**
 * Signin
 * This is triggered when the user post to /login
 */
exports.signin = function(req, res) {
    res.redirect('/dashboard');
}

exports.randomLogin = function(req, res) {
    Access.findOne({ randomToken: req.params.hash }).populate('project', 'shortURL').exec(function(err, access) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        return res.redirect('/project/' + access.project.shortURL);

    });
}


/**
 * Signup
 */
exports.signup = function(req, res) {
        res.render('users/signup', { title: 'Registrer deg', invite: false });
}

/**
 * Create users
 */
exports.create = function(req, res) {
    var user = new User(req.body);
    user.provider = 'local';
    user.save(function(err) {
        if (err) return res.render('users/signup', { errors: err.errors, user: user });
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
    if (!req.user.email || req.user.email === undefined) return res.redirect('/registerEmail');

    res.redirect('/dashboard');
}


/**
 * registerEmail
 * Will register the users email if they don't have already
 */

exports.registerEmail = function(req, res) {
    // in case some user who has alreadu registered an email gets on this page
    if (req.user.email !== undefined) return res.redirect('/dashboard');
    res.render('users/registerEmail', { title: 'Registrer din e-post' });
}


/**
 * postRegisterEmail
 */

exports.postRegisterEmail = function(req, res) {

    v.check(req.body.email, 'You need to supply a proper email').isEmail();
    var errors = v.getErrors();
    if (errors.length !== 0) return res.status(500).render('error', { title: '500', text: 'Det oppstod en valideringsfeil<br>' + errors, error: errors });

    // first we need to check if the email is already in use
    User.findOne({ email: req.body.email }, function(err, user) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

        // if mail is in use..
        if (user) return res.render('users/registerEmail', { title: 'Den e-posten er allerede i bruk. Vennligs registrer en annen.' });

        User.update({ _id: req.user._id }, { email: req.body.email, status: 3 }, function(err) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
            return res.redirect('/dashboard');
        });
    });
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
                if (m) {
                    v.check(m, m + ' is not a valid email').isEmail();
                }
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
                        newUser.username = mailAddress;
                        newUser.name = mailAddress + ' <span class="muted">(ikke registrert)</span>';
                        newUser.status = 1;
                        newUser.password = newUser.generateRandomToken(32);
                        newUser.randomToken = newUser.generateRandomToken(10, true);
                        newUser.save(function(err) {
                            if (err) return res.render('project/participants', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
                            console.log('made new user ' + newUser._id);
                            var access = new Access();
                            access.user = newUser._id;
                            access.creator = req.user._id;
                            access.project = project._id;
                            access.randomToken = access.generateRandomToken(15);
                            access.save(function(err) {
                                if (err) {
                                    console.log(err.errors);
                                    return res.render('project/participants', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
                                }
                                console.log('made new access for user ' + newUser._id);
                                message.to = newUser.email;
                                message.text = 'Hei! Du har blitt invitert til å delta i et Divid-prosjekt! https://divid.no/invite/' + newUser.randomToken + '\n Du kan også gå direkte til prosjektet her: https://divid.no/login/' + access.randomToken;
                                server.send(message, function(err, message) { console.log(err || message);});
                            });
                        });

                    } else { // if the user exists, add him to the project
                        Access.checkAccess(user._id, project._id, 0, function(err, acc) {
                            if (err) return res.render('project/participants', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
                            if (acc) { // if the user already has access to the project.. do nothing
                                console.log('user ' + user.email + ' already has access to project ' + project.name);
                            } else {
                                console.log('fant en bruker. må lage ny access til han og si i fra.');
                                var access = new Access();
                                access.user = user._id;
                                access.creator = req.user._id;
                                access.project = project._id;
                                message.text = 'Du ble lagt til projektet "' + project.name + '"';
                                if (Number(user.status) < 3) {
                                    access.randomToken = access.generateRandomToken(15);
                                    message.text += '.\nDu kan få direkte tilgang til dette prosjektet her: https://divid.no/login/' + access.randomToken + ' \nDu kan bruke denne linken for å registrere deg, for å få tilgang til flere funksjoner: https://divid.no/invite/' + user.randomToken;
                                }
                                access.save(function(err) {
                                    if (err) {
                                        console.log(err.errors);
                                        return res.render('project/participants', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
                                    }
                                    console.log('made new access for user ' + user.username);
                                    message.to = user.email;
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


/**
 * claimInvite
 * So users can use their inviteEmail
 */

exports.claimInvite = function(req, res) {

    // first we need to check if the invite is valid!
    User.findOne({ randomToken: sanitize(req.params.randomToken).escape(), status: 1 }, function(err, user) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        if (!user) return res.render('error', { title: 'This invite does not exist', text: 'Invitasjonen din er ugyldig' });

        res.render('users/signup', {
            invite: true,
            title: 'Registrer deg!',
            email: user.email }
        );
    });


}


exports.postClaimInvite = function(req, res) {

    User.findOne({ randomToken: sanitize(req.params.randomToken).escape(), status: 1 }, function(err, user) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        if (!user) return res.render('error', { title: 'This invite does not exist', text: 'Invitasjonen din er ugyldig' });

        v.check(req.body.password).notEmpty();
        v.check(req.body.name).notEmpty();
        v.check(req.body.username).notEmpty();

        errors = v.getErrors();
        if (errors.length !== 0) return res.status(500).render('error', { title: '500', text: 'Det oppstod en valideringsfeil<br>' + errors, error: errors });

        user.name = sanitize(req.body.name).escape();
        user.username = sanitize(req.body.username).escape();
        user.password = req.body.password;
        user.provider = 'local';
        user.status = 3;
        user.randomToken = '';
        user.save(function(err) {
            if (err) return res.render('signup', { errors: err.errors, user: user });
            req.logIn(user, function(err) {
                if (err) return next(err);
                return res.redirect('/dashboard');
            });
        });
    });
}

