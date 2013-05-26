
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
    this._errors = ''; // need to reset errors between sessions because of object model
    return returnThis;
}

/**
 * Before the user log in
 * ===============================================================
*/

exports.index = function(req, res) {
    if (req.user !== undefined) { return res.redirect('/dashboard'); }
    res.render('index', { title: 'Divid', user: req.user });
    };


exports.faq = function(req, res) {
    res.render('faq', {
        title: 'faq',
        user: req.user
    });
}


exports.contact = function(req, res) {
    res.render('contact', {
        title: 'contact',
        user: req.user
    });
}


/**
 * After the user has logged in
 * ===============================================================
*/



exports.dashboard = function(req, res) {

/*
    Access.find({ user: req.user._id }, function(err, accesses) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        console.log('accesses ' + accesses);
        accesses.forEach(function(access) {
            Project.load(access.project, function(err, project) {
                    if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
                    projectList.push(project);
                    console.log(project.user.username);
                });
        });
    });
*/
    if (req.user.status < 3) {
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    Access.loadUser(req.user._id, function(err, projects) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        var projectIDs = [];
        var pro = { project: [] };
        projects.forEach(function(project) {
            projectIDs.push(project.project._id);
            pro.project[project.project._id] = {
                total:  0  // total for project
              , user:   0  // what req-user has spent on project
              , users:  0  // number of users on project
            };
        });
        Access.loadProjects(projectIDs, function(err, participants) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
            participants.forEach(function(p) {
                pro.project[p.project].users++;
            });
            pPost.loadByProjects(projectIDs, function(err, posts) {
                if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
                Access.loadProjects(projectIDs, function(err, participants) {
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
            /*            res.render('dashboard', {
                title: 'Dashboard',
                user: req.user,
                projects: projects
            });
*/
        });
    });

/*
    Project.find(function(err, projects) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        res.render('dashboard', {
            title: 'Dashboad',
            user: req.user,
            projects: projects
        });
    });*/
}



exports.project = function(req, res) {
    Project.loadShort(req.params.short, function(err, project) {
        if (err || !project) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err });
        Access.loadProject(project._id, function(err, access) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
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
                for (var i in pro.user) {
                    if (pro.user[i].diff > 0) pro.user[i].coeff = pro.user[i].diff / pro.otot;
                }
                console.log(pro);
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


exports.projectParticipants = function(req, res) {
    if (req.user.status < 3) {
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }
    res.render('project/participants', { title: 'Prosjektdeltakere', user: req.user });

}


exports.projectPost = function(req, res) {

   /** ###################################
    * Need to check if user has access to this project!!
    */
    Project.loadShort(req.params.short, function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        req.project = project;
        res.render('project/post', { title: 'Legg til utgift', user: req.user, req: req, project: project });
    });



}

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
exports.newProject = function(req, res) {
    if (req.user.status < 3) {
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    res.render('project/newProject', { title: 'Nytt prosjekt', user: req.user });
}

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
                return res.render('project/newProject', { title: 'Nytt prosjekt - en feil oppstod', user: req.user });
            }
            return res.redirect('/dashboard');
        });
    });

}


exports.deleteProjectPost = function(req, res) {
    Project.findOne({ shortURL: req.params.short }).select('_id').exec(function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        Access.findOne({project: project._id, user: req.user._id}, function(err, access) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
            if (!access) return res.status(403).render('error', { title: '403', text: 'Du har ikke tilgang til å gjøre dette' });
            pPost.load(req.params.post, function(err, post) {
                if (err || !post) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err });
                if (post.user._id === req.user._id || access.permissions >= 6) {
                    pPost.remove({ _id: post._id }, function(err) {
                        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
                        console.log('deleted post ' + post._id);
                        return res.redirect('back');
                    })
                } else { return res.status(403).render('error', { title: '403', text: 'Du har ikke tilgang til å gjøre dette' }); }
            })
        })
    });
}


