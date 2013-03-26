






module.exports = function(app) {
    /*
     * GET home page.
     *
     * '/'
     */

    app.get('/', function(req, res){
        // check if the user's credentials are saved in a cookie
        if (req.cookies.user == undefined || req.cookies.pass == undefined) {
            res.render('index', { title: 'DERS' });
        } else { // appempt automatic login
            AM.autoLogin(req.cookies.user, req.cookies.pass, function(o) {
                if (o != null) {
                    req.session.user = o;
                    res.redirect('/account');
                } else {
                    res.render('index', { title: 'DERS' });
                }
            });
        }
    });


    /*
     * GET login page
     *
     * '/login'
     */

    app.get('/login', function(req, res) {
        res.render('login', { title: 'Logg inn' });
    });


    /*
     * GET signup page
     *
     * '/signup'
     */

    app.get('/signup', function(req, res) {
        res.render('signup', { title: 'Registrer deg' });
    });










    /*
     * 404 ERROR
     */

    app.get('*', function(req, res) {
        res.render('error', { title: '404', text: 'Fant ikke siden' });
    });














}
