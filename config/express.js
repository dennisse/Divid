
/**
 * Module dependencies
 */

var express = require('express');


/**
 * Module
 */

module.exports = function (app, config, passport) {

    //sets view engine and path
    app.set('views', config.root + '/app/views');
    app.set('view engine', 'ejs');

    app.use(express.static(config.root + '/public'));

    // don't use logger for test env
    if (process.env.NODE_ENV !== 'test') app.use(express.logger('dev'));


    app.configure(function () {

        app.use(express.cookieParser()); //must be above sessions

        app.use(express.bodyParser()); //must be above methodOverride

        app.use(express.methodOverride());

        app.use(express.session({ secret: config.sessionSecret }));

        // use passport session
        app.use(passport.initialize()); // initializes passport, our login module
        app.use(passport.session());    // With sessions!

        app.use(express.favicon(__dirname + '/public/favicon.ico'));

        // use LESS for CSS
        app.use(require('less-middleware')({ src: config.root + '/public' }));

        app.use(app.router);

        // If no routes are triggered, we reach these babies:

        app.use(function(err, req, res, next) {
            if (~err.message.indexOf('not found')) return next(); // treat like 404

            console.error(err.stack);

            res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack }); // render page
        });

        app.use(function(req, res, next) {
            res.status(404).render('error', { title: '404', text: 'Fant ikke siden du så etter' }); // render page
        });
    });
}


