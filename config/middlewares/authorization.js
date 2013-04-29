

/*
 * Generic require login routing
 */

exports.requiresLogin = function(req, res, next) {
    if (!req.isAuthenticated()) return res.redirect('/test');
    next();
}



