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




    app.get('/dashboard', system.dashboard);


    app.get('/login', users.login);


    app.post('/login', users.signin);


    // GET /auth/facebook
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  The first step in Facebook authentication will involve
    //   redirecting the user to facebook.com.  After authorization, Facebook will
    //   redirect the user back to this application at /auth/facebook/callback
    app.get('/auth/facebook', passport.authenticate('facebook'), function(req, res){
        // The request will be redirected to Facebook for authentication, so this
        // function will not be called.
    });

    // GET /auth/facebook/callback
    //   Use passport.authenticate() as route middleware to authenticate the
    //   request.  If authentication fails, the user will be redirected back to the
    //   login page.  Otherwise, the primary route function function will be called,
    //   which, in this example, will redirect the user to the home page.
    app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), function(req, res) {
        console.log('/auth/facebook/callback --- ' + req.user.username);
        res.redirect('/dashboard');
    });
    app.get('/auth/twitter', passport.authenticate('twitter', { failureRedirect: '/login' }), users.signin);
    app.get('/auth/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), users.authCallback);

    /*
     * GET logout
     *
     * '/logout'
     */
    app.get('/logout', users.logout);




    /*
     * GET project page
     *
     * '/project'
    */

    app.get('/project', system.project);



    /*
     * GET signup page
     *
     * '/signup'
     */

    app.get('/signup', users.signup);


    /* POST */

    app.post('/signup', users.create);


};
