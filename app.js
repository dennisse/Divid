
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

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
    app.use(express.favicon()); // sets favicon
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


/**
 * Routes
 */

app.get('/', routes.index);
app.get('/login', routes.login);
app.get('/users', user.list);






/**
 * Server initiation
 */

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
