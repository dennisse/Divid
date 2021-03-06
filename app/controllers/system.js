
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config.js')[env]
  , Project = mongoose.model('Project')
  , Access = mongoose.model('Access')
  , User = mongoose.model('User')
  , pPost = mongoose.model('pPost')
  , Validator = require('validator').Validator
  , v = new Validator()
  , sanitize = require('validator').sanitize;


// validation error handling. This collects all errors before pushing them out in getErrors()
Validator.prototype.error = function(msg) {
    this._errors.push(msg);
    return this;
}
Validator.prototype.getErrors = function() {
    var returnThis = this._errors;
    this._errors = ''; // need to reset errors between sessions because of object model that retains errors
    return returnThis;
}


/**
 * Before the user log in
 * ===============================================================
*/


/**
 * GET '/'
 */

exports.index = function(req, res) {
    if (req.user !== undefined) return res.redirect('/dashboard'); // if the user is logged in, redirect to dashboard
    res.render('index', {
        title: 'Divid'
      , user:req.user
    });
}


/**
 * GET '/faq'
 */

exports.faq = function(req, res) {
    res.render('faq', {
        title: 'FAQ'
      , user: req.user
    });
}


/**
 * GET '/contact'
 */

exports.contact = function(req, res) {
    res.render('contact', {
        title: 'Kontakt'
      , user: req.user
    });
}



/**
 * After the user has logged in
 * ===============================================================
*/


/**
 * GET '/dashboard'
 */

exports.dashboard = function(req, res) {

    // check if user is actually registered
    if (req.user.status < 3) {
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    // start by loading all the projects the current user has access to
    Access.loadUser(req.user._id, function(err, projects) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

        var projectIDs = [];
        var pro = { project: [] };

        // Time to initiate some projects so we can calculate how much the user owes / is owned
        projects.forEach(function(project) {
            projectIDs.push(project.project._id); // fills an array with all the project IDs
            pro.project[project.project._id] = { // initiates an object for each project, where we can store some data
                total:  0  // total for project
              , user:   0  // what req-user has spent on project
              , users:  0  // number of users on project
            };
        });

        // loads all the users for the projects the current user has access to
        // this is necessary so we can calculate what the user owes based on how many users each project has
        Access.loadProjects(projectIDs, function(err, participants) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

            // counts the users in each project
            participants.forEach(function(p) {
                pro.project[p.project].users++;
            });

            // loads ALL posts for EVERY project the user has access to
            pPost.loadByProjects(projectIDs, function(err, posts) {
                if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

                // FUN FUN FUN CALCULATIONS
                posts.forEach(function(p) {
                    if (String(p.user._id) === String(req.user._id)) pro.project[p.project._id].user += p.value;
                    pro.project[p.project._id].total += p.value;
                });

                res.render('dashboard', {
                    title: 'Dashboard'
                  , user: req.user
                  , projects: projects
                  , posts: posts
                  , participants: participants
                     , pro: pro
                });
            });
        });
    });
}


/**
 * GET '/project/:short'
 * :short = shortURL for project
 */

exports.project = function(req, res) {
    // loads the project based on the :short part of the url
    Project.loadShort(req.params.short, function(err, project) {
        if (err || !project) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err });

        //loads all users in project
        Access.loadProject(project._id, function(err, access) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

            // loads all posts in project
            pPost.loadProject(project._id, function(err, posts) {
                if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

                // ALRIGHT! This is where the FUN starts!

               // first we create an object that will hold all the calculational data
                var pro = {
                        users:  0   // number of users
                      , user:   []  // this array will contain every user. Every user will then have it's own object inside this.
                      , total:  0   // the overall total.
                      , each:   0   // what each person has to pay
                      , otot:   0   // how much is owned in total!
                    };

                // then we calculate how many users we have, and initiate objects foreach user
                access.forEach(function(a) {
                    if (String(a.user._id) === String(req.user._id)) req.user.permissions = a.permissions; //sets YOUR permissions in this project

                    pro.users++;
                    pro.user[a.user._id] = {
                            total:  0
                          , diff:   0
                          , coeff:  0   // the coefficient of hom much you are owned
                          , name:   a.user.name
                        };
                });

                // now we must collect all the money!
                posts.forEach(function(p) {
                    pro.total += parseFloat(p.value);
                    pro.user[p.user._id].total += parseFloat(p.value);
                });

                // then calculate how much each user must pay in total
                pro.each = pro.total / pro.users;

                // then calculate how much each person owe and is owned
                for(var i in pro.user) {
                    pro.user[i].diff = parseFloat(pro.user[i].total - pro.each).toFixed(2);
                    if (pro.user[i].diff > 0) pro.otot += parseFloat(pro.user[i].diff);
                }

                // sets the coefficient if the user is owed money
                for (var i in pro.user) {
                    if (pro.user[i].diff > 0) pro.user[i].coeff = pro.user[i].diff / pro.otot;
                }

                res.render('project/project', {
                    title: project.name
                  , user: req.user
                  , req: req
                  , project: project
                  , access: access
                  , posts: posts
                  , pro: pro
                });
            });
        });
    });
}


/**
 * GET '/project/:short/participants'
 *
 * POST is in app/controllers/users.js
 */

exports.projectParticipants = function(req, res) {
    // check if user is actually registered
    if (req.user.status < 3) {
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    res.render('project/participants', {
        title: 'Prosjektdeltakere'
      , user: req.user
    });
}


/**
 * GET '/projet/:short/post'
 */

exports.projectPost = function(req, res) {

    Project.loadShort(req.params.short, function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        req.project = project;
        res.render('project/post', {
            title: 'Legg til utgift'
          , user: req.user
          , req: req
          , project: project
        });
    });
}


/**
 * POST '/project:short/post'
 */

exports.postProjectPost = function(req, res) {

    // Validation
    v.check(req.body.project, 'The project was lost').notEmpty();
    v.check(req.body.what, 'You need to fill in the what-field').notEmpty();
    v.check(req.body.value, 'The value must be a positive number').notEmpty().isInt().min(0);

    // error when validation fails
    var errors = v.getErrors();
    if (errors.length !== 0) return res.status(500).render('error', { title: '500', text: 'Det oppstod en valideringsfeil ' + errors, error: errors });

    Project.loadShort(req.params.short, function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

        // check if access
        Access.checkAccess(req.user._id, project._id, 0, function(err, access) {
            if (err || !access) return res.status(403).render('error', { title: '403', text: 'no sir.' });

            // Time to fill in the model!
            var ppost = new pPost();

            ppost.user         = req.user._id;
            ppost.for          = req.user._id;
            ppost.project      = project._id;
            ppost.what         = sanitize(req.body.what).escape();
            ppost.comment      = sanitize(req.body.comment).xss(); // xss will remove cross-site-scripting in the textfield.
            ppost.participants = sanitize(req.body.participants).escape();
            ppost.value        = sanitize(req.body.value).toInt(); // this will remove leading zeroes. '0123' => '123'
            ppost.when         = new Date(sanitize(req.body.date).escape() + ' ' + sanitize(req.body.time).escape() + ':00');

            ppost.save(function(err) {
                if (err) return res.render('project/post', { title: 'Legg til utgift - en feil oppstod', user: req.user, req: req, project: project });
                return res.redirect('/project/' + project.shortURL);
            });
        });
    });
}


/**
 * GET '/project/new'
 */

exports.newProject = function(req, res) {
    if (req.user.status < 3) {
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    res.render('project/newProject', {
        title: 'Nytt prosjekt'
      , user: req.user
    });
}


/**
 * POST '/project/new'
 */

exports.postNewProject = function(req, res) {
    if (req.user.status < 3) {
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    var project = new Project(req.body);
    project.user = req.user._id;
    project.save(function(err) {
        if (err) {
            console.log(err.errors);
            return res.render('project/newProject', { title: 'Nytt prosjekt - en feil oppstod', user: req.user, errors: err.errors, project: project });
        }
        var access = new Access();
        access.user = req.user._id;
        access.creator = req.user._id;
        access.project = project._id;
        access.permissions = 9;
        access.save(function(err) {
            if (err) {
                console.log(err.errors);
                return res.render('project/newProject', {
                    title: 'Nytt prosjekt - en feil oppstod'
                  , user: req.user
                });
            }
            return res.redirect('/dashboard');
        });
    });

}


/**
 * GET '/project/:short/delete/:post'
 */

exports.deleteProjectPost = function(req, res) {

    //Locate project
    Project.findOne({ shortURL: req.params.short }).select('_id').exec(function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

        //make sure you actually have access
        Access.findOne({project: project._id, user: req.user._id}, function(err, access) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
            if (!access) return res.status(403).render('error', { title: '403', text: 'Du har ikke tilgang til å gjøre dette' });

            pPost.load(req.params.post, function(err, post) {
                if (err || !post) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err });

                if (post.user._id === req.user._id || access.permissions >= 6) {

                    // delete! (only if access)
                    pPost.remove({ _id: post._id }, function(err) {
                        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

                        return res.redirect('back');
                    })
                } else { return res.status(403).render('error', { title: '403', text: 'Du har ikke tilgang til å gjøre dette' }); }
            })
        })
    });
}


