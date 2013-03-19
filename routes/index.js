
/*
 * GET home page.
 *
 * '/'
 */

exports.index = function(req, res){
    // res.render(TEMPLATE, OBJECT WITH VARIABLES)
    res.render('index', { title: 'Express' });
};
