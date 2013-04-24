var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , mongodb = require('mongodb')
  , mongoose = require('mongoose')
  , bcrypt = require('bcrypt')
  , SALT_WORK_FACTOR = 15;


// connects to mongodb
mongoose.connect('localhost', 'test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback(){
    console.log('Connected to MongoDB');
});

// user scheme
var userSchema = mongoose.Schema({
    username:   { type: String, required: true, unique: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true }, //passwords doesn't need to be unique
    accessToken:{ type: String } // used for Remember Me
});

// bcrypt middleware
userSchema.pre('save', function(next) {
    var user = this;

    if (!user.isModified('password')) return next();

    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            user.password = hash;
            next();
        });
    });
});

// password verification
userSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

// remember me implementation
userSchema.methods.generateRandomToken = function () {
    var user = this,
        chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
        token = new Date().getTime() + '_';
    for (var x = 0; x < SALT_WORK_FACTOR; x++) {
        var i = Math.floor(Math.random() * 94);
        token += chars.charAt(i);
    }
    return token;
};

// seed a test user
var User = mongoose.model('User', userSchema);

var usr = new User({ username: 'bob', email: 'bob@example.com', password: 'secret' });
usr.save(function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('user: ' + usr.username + + 'saved.');
    }
})

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
//
//   Both serializer and deserializer edited for Remember Me functionality
passport.serializeUser( function(user, done) {
    var createAccessToken = function() {
        var token = user.generateRandomToken();
        User.findOne( { accessToken: token }, function (err, existingUser) {
            if (err) return done(err);
            if (existingUser) {
                createAccessToken(); //run it again. has to be unique
            } else {
                user.set('accessToken', token);
                user.save( function(err) {
                    if (err) return done(err);
                    return done(null, user.get('accessToken'));
                });
            }
        });
    }
    if (user._id) { createAccessToken(); }
});

passport.deserializeUser( function(token, done) {
    User.findOne( { accessToken: token }, function(err, user) {
        done(err, user);
    });
});

// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
/*passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
        if (err) return done(err);
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        user.comparePassword(password, function(err, isMatch) {
            if (err) return done(err);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Invalid password' });
            }
        });
    });
}));*/

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid password' });
      }
    });
  });
}));


// to ensure that users are logged in
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

/*
 * ============================================================
 * Routes
 *
 */



module.exports = function(app) {
    /*
     * GET home page.
     *
     * '/'
     */

    app.get('/', function(req, res){
        res.render('index', { title: 'DERS' });
    });

    /*
     * GET TEST PAGE
     *
     * '/test'
     */

    app.get('/test', function(req, res) {
        res.render('test', {
            title: 'test',
            loggedin: false
        });
    });

    app.get('/home', function(req, res) {
        res.render('home', {
            title: 'home',
            loggedin: false
        });
    });


    /*
     * GET dashboard
     *
     * '/dashboard'
     */

    app.get('/dashboard', function(req, res) {
        ensureAuthenticated();
            res.render('dashboard', {
                                        title: 'kanin',
                                        loggedin: true
                                    });
    });



    /*
     * GET login page
     *
     * '/login'
     */

    app.get('/login', function(req, res) {
            res.render('login', { title: 'Logg inn' });
    });


    /* POST */

    app.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) return next(err);
            if (!user) {
                console.log(info.message);
                req.session.messages = [info.message];
                return res.redirect('/login');
            }
            req.logIn(user, function(err) {
                if (err) return next(err);
                return res.redirect('/dashboard');
            })
        })(req, res, next);
    });



    /*
     * GET logout
     *
     * '/logout'
     */
    app.post('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });




    /*
     * GET project page
     *
     * '/project'
    */

    app.get('/project', function(req, res) {
        res.render('project', { title: 'Harepus', loggedin: true });
    })





    /*
     * GET signup page
     *
     * '/signup'
     */

    app.get('/signup', function(req, res) {
        res.render('signup', { title: 'Registrer deg' });
    });


    /* POST */

    app.post('/signup', function(req, res) {
        AM.addNewAccount({
            name    : req.param('name'),
            email   : req.param('email'),
            user    : req.param('user'),
            pass    : req.param('pass'),
            country : req.param('country')
        }, function(e) {
            if (e) {
                res.send(e, 400);
            } else {
                res.send('ok', 200);
            }
        });
    });





    /*
     * ERRORS
     */

    /* 404 */
    app.get('*', function(req, res) {
        res.render('error', { title: '404', text: 'Fant ikke siden' });
    });

    /* 403 on POST */
    app.post('*', function(req, res) {
        res.render('error', { title: '403', text: 'Du har ikke tilgang til denne siden' });
    });


};
