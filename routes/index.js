
/*
 * GET home page.
 *
 * '/'
 */

exports.index = function(req, res){
    // res.render(TEMPLATE, OBJECT WITH VARIABLES)
    res.render('index', { title: 'DERS' });
};


/*
 * GET login page
 *
 * '/login'
 */

exports.login = function(req, res) {
    res.render('login', {title: 'Logg inn' });
}
