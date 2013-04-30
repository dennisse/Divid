
/**
 * Module dependencies.
 */
var express = require('express')
  , fs = require('fs')
  , passport = require('passport')
  , mongoose = require('mongoose');

/**
 * App configuration
 */
var port = process.env.PORT || 8000
  , env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , auth = require('./config/middlewares/authorization');

// Bootstrap db connection
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback(){
    console.log('Connected to MongoDB');
});

// Bootstrap models
// This gets all model files in ./models
var models_path = __dirname + '/models';
fs.readdirSync(models_path).forEach( function(file) {
    require(models_path + '/' + file);
});

// Bootstrap passport config
require('./config/passport')(passport, config);

/**
 * Express
 */
var app = express();
// express settings
require('./config/express')(app, config, passport);


/**
 * Routes
 */
require('./routes')(app, passport, auth);


/**
 * Server initiation
 */
app.listen(port, function() {
    console.log("Express server listening on port " + port);
});

