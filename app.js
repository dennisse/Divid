
/**
 * Module dependencies.
 */

var express = require('express')
  , path = require('path')
  , passport = require('passport');


var app = express(); // initiates express

/**
 * App configuration
 */
var port = process.env.PORT || 3000
  , env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env];



/**
 * Express
 */
var app = express();
// express settings
require('./config/express')(app, config, passport);


/**
 * Routes
 */
require('./router')(app, config);


/**
 * Server initiation
 */

app.listen(port, function() {
    console.log("Express server listening on port " + port);
});



