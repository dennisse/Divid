// AUTH Middleware. This is what checks if you are logged in.

/*
 * Generic require login routing
 */

exports.requiresLogin = function(req, res, next) {
    if (!req.isAuthenticated()) return res.redirect('/');
    next();
}



