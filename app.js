
/**
 * Module dependencies.
 */

var express = require('express')
  , path = require('path')
  , bcrypt = require('bcrypt')
  , passport = require('passport');

var app = express(); // initiates express



/**
 * App configuration
 */

app.configure(function(){
    // this controls the port the application will be running on.
    // by adding 'process.enc.PORT' we enable the app to run on automated systems like heroku
    app.set('port', process.env.PORT || 8000);

    app.set('views', __dirname + '/views'); // sets views to the right directory
    app.set('view engine', 'ejs'); // initiates viewengine. We use EJS, or embedded js - http://embeddedjs.com/
    app.use(express.favicon(__dirname + '/public/faviconb.ico')); // sets favicon
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'lsdrghoi4hgqio42nqf2uqi32f3bilu23fl23b' }));
    app.use(express.methodOverride());
    app.use(require('less-middleware')({ src: __dirname + '/public' }));
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(passport.initialize());
    app.use(passport.session());
});

app.configure('development', function(){
  app.use(express.errorHandler());
});



/**
 * Routes
 */

require('./router')(app);



/**
 * Server initiation
 */

app.listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});



