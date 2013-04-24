
/**
 * Module dependencies
 */

var express = require('express');


/**
 * Module
 */

module.exports = function (app, config, passport) {

    //sets view engine and path
    app.set('views', config.root + '/views');
    app.set('view engine', 'ejs');

    app.use(express.static(config.root + '/public'));

    // don't use logger for test enc
    if (process.env.NODE_ENV !== 'test') app.use(express.logger('dev'));


    app.configure(function () {

        app.use(express.cookieParser()); //must be above sessions

        app.use(express.bodyParser()); //must be above methodOverride

        app.use(express.methodOverride());

        app.use(express.session({ secret: 'lsdrghoi4hgqio42nqf2uqi32f3bilu23fl23b' }));

        // use passport session
        app.use(passport.initialize());
        app.use(passport.session());

        app.use(express.favicon(__dirname + '/public/faviconb.ico'));

        // use LESS for CSS
        app.use(require('less-middleware')({ src: config.root + '/public' }));

        app.use(app.router);

        app.use(function(err, req, res, next) {
            if (~err.message.indexOf('not fount')) return next(); // treat like 404

            console.error(err.stack);

            res.status(500).render('500', { error: err.stack }); // render page
        });

        app.use(function(req, res, next) {
            res.status(404).render('404', { url: req.originalUrl, error: 'Not found' }); // render page
        });
    });
}


