
/**
 * Dependencies
 */

var users = require('../app/controllers/users')
  , system = require('../app/controllers/system');


/*
 * ============================================================
 * Routes
 *
 */

module.exports = function(app, passport, auth) {
    app.get('/', system.index);

    app.get('/faq', system.faq);

    app.get('/contact', system.contact);

    app.post('/login', passport.authenticate('local', { failureRedirect: '/' }), users.signin);

    app.get('/signup', users.signup);

    app.post('/signup', users.create);

    app.get('/auth/facebook', passport.authenticate('facebook', { failureRedirect: '/' }), users.signin);
    app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/' }), users.authCallback);

    app.get('/auth/twitter', passport.authenticate('twitter', { failureRedirect: '/' }), users.signin);
    app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/' }), users.authCallback);

    app.get('/invite/:randomToken', users.claimInvite); // :randomToken can be retrieved in 'req.params.randomToken'

    app.post('/invite/:randomToken', users.postClaimInvite);

    app.get('/logout', users.logout);

    app.get('/login/:hash', passport.authenticate('hash', { failureRedirect: '/'}), users.randomLogin);


   /**
    * REQUIRES LOGIN
    * ============================================================
    */

    app.get('/dashboard', auth.requiresLogin, system.dashboard);

    app.get('/registerEmail', auth.requiresLogin, users.registerEmail);

    app.post('/registerEmail', auth.requiresLogin, users.postRegisterEmail);

    app.get('/project', auth.requiresLogin, system.project);

    app.get('/project/new', auth.requiresLogin, system.newProject);

    app.post('/project/new', auth.requiresLogin, system.postNewProject);

    app.get('/project/:short', auth.requiresLogin, system.project);

    app.get('/project/:short/post', auth.requiresLogin, system.projectPost);

    app.post('/project/:short/post', auth.requiresLogin, system.postProjectPost);

    app.get('/project/:short/participants', auth.requiresLogin, system.projectParticipants);

    app.post('/project/:short/participants', auth.requiresLogin, users.postProjectParticipants); // goes to the usercontroller because participants are users

    app.get('/project/:short/delete/:post', auth.requiresLogin, system.deleteProjectPost);

};
