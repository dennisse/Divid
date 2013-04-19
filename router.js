var passlo = require('./modules/passport-local')
  , passport = require('passport')
  , EM = require('./modules/email-dispatcher');





module.exports = function(app) {
    /*
     * GET home page.
     *
     * '/'
     */

    app.get('/', function(req, res){
        res.render('index', { title: 'DERS' });
    });

    /*
     * GET TEST PAGE
     *
     * '/test'
     */

    app.get('/test', function(req, res) {
        res.render('test', {
            title: 'test',
            loggedin: false
        });
    });


    /*
     * GET dashboard
     *
     * '/dashboard'
     */

    app.get('/dashboard', function(req, res) {
            res.render('dashboard', {
                                        title: 'kanin',
                                        loggedin: true
                                    });
    });



    /*
     * GET login page
     *
     * '/login'
     */

    app.get('/login', function(req, res) {
            res.render('login', { title: 'Logg inn' });
    });


    /* POST */

    app.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) return next(err);
            if (!user) {
                console.log(info.message);
                req.session.messages = [info.message];
                return res.redirect('/login');
            }
            req.logIn(user, function(err) {
                if (err) return next(err);
                return res.redirect('/dashboard');
            })
        })(req, res, next);
    });

    /*
     * GET project page
     *
     * '/project'
    */







    /*
     * GET signup page
     *
     * '/signup'
     */

    app.get('/signup', function(req, res) {
        res.render('signup', { title: 'Registrer deg' });
    });


    /* POST */

    app.post('/signup', function(req, res) {
        AM.addNewAccount({
            name    : req.param('name'),
            email   : req.param('email'),
            user    : req.param('user'),
            pass    : req.param('pass'),
            country : req.param('country')
        }, function(e) {
            if (e) {
                res.send(e, 400);
            } else {
                res.send('ok', 200);
            }
        });
    });





    /*
     * ERRORS
     */

    /* 404 */
    app.get('*', function(req, res) {
        res.render('error', { title: '404', text: 'Fant ikke siden' });
    });

    /* 403 on POST */
    app.post('*', function(req, res) {
        res.render('error', { title: '403', text: 'Du har ikke tilgang til denne siden' });
    });


};
