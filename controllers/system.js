
/**
 * Module dependencies
 */





/**
 * Before the user log in
 * ===============================================================
*/

exports.index = function(req, res) {
        res.render('index', { title: 'DERS' });
    };



exports.test = function(req, res) {
        res.render('test', {
            title: 'test',
            loggedin: false
        });
    };


exports.home = function(req, res) {
        res.render('home', {
            title: 'home',
            loggedin: false
        });
    };







/**
 * After the user has logged in
 * ===============================================================
*/



exports.dashboard = function(req, res) {
        console.log('/dashboard - ' + req.user);
        res.render('dashboard', {
            title: 'kanin',
            loggedin: true
        });
    };



exports.project = function(req, res) {
        res.render('project', { title: 'Harepus', loggedin: true });
}

