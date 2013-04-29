
/**
 * Dependencies
 */

var users = require('./controllers/users')
  , system = require('./controllers/system');


/*
 * ============================================================
 * Routes
 *
 */

module.exports = function(app, passport, auth) {
    app.get('/', system.index);

    app.get('/test', system.test);

    app.get('/home', system.home);

    app.get('/faq', system.faq);

    app.get('/login', users.login);

    app.get('/signup', users.signup);

    app.post('/signup', users.create);


    app.post('/test', users.signin);

    app.get('/auth/facebook', passport.authenticate('facebook', { failureRedirect: '/test' }), users.signin);

    app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/test' }), function(req, res) {
        console.log('/auth/facebook/callback --- ' + req.user.username);
        res.redirect('/dashboard');
    });

    app.get('/auth/twitter', passport.authenticate('twitter', { failureRedirect: '/test' }), users.signin);
    app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/test' }), users.authCallback);

    app.get('/logout', users.logout);


   /**
    * REQUIRES LOGIN
    * ============================================================
    */


    app.get('/dashboard', system.dashboard);


    app.get('/project', auth.requiresLogin, system.project);

    app.get('/project/new', auth.requiresLogin, system.newproject);

};
