
/**
 * Module dependencies
 */
var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config.js')[env]
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


    if (req.user.status < access) {
        console.log(req.header('Referer'));
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }


/**
 * Before the user log in
 * ===============================================================
*/

exports.index = function(req, res) {
    if (req.user !== undefined) { return res.redirect('/dashboard'); }
    res.render('index', { title: 'DERS', user: req.user });
    };



exports.test = function(req, res) {
    res.render('test', {
        title: 'test',
        user: req.user
    });
};


exports.home = function(req, res) {
    res.render('home', {
        title: 'home',
        user: req.user
    });
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
        console.log(req.header('Referer'));
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    Access.loadUser(req.user._id, function(err, projects) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        var projectIDs = [];
        projects.forEach(function(project) { projectIDs.push(project.project._id); console.log(project.project.name); });
        Access.loadProjects(projectIDs, function(err, participants) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
            pPost.loadByProjects(projectIDs, function(err, posts) {
                if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
                Access.loadProjects(projectIDs, function(err, participants) {
                    if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
                    res.render('dashboard', {
                        title: 'Dashboard',
                        user: req.user,
                        projects: projects,
                        posts: posts,
                        participants: participants
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
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        Access.loadProject(project._id, function(err, access) {
            if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
            pPost.loadProject(project._id, function(err, posts) {
                if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
                res.render('project', { title: project.name, user: req.user, req: req, project: project, access: access, posts: posts });
            });
        });

    });
}

exports.projectParticipants = function(req, res) {
    if (req.user.status < 3) {
        console.log(req.header('Referer'));
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }
    res.render('projectParticipants', { title: 'Prosjektdeltakere', user: req.user });

}


exports.projectPost = function(req, res) {

   /** ###################################
    * Need to check if user has access to this project!!
    */
    console.log(req.loggedin);
    Project.loadShort(req.params.short, function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        req.project = project;
        res.render('projectPost', { title: 'Legg til utgift', user: req.user, req: req, project: project });
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
                if (err) return res.render('projectPost', { title: 'Legg til utgift - en feil oppstod', user: req.user, req: req, project: project });
                return res.redirect('/project/' + project.shortURL);
            });
        });
    });
}
exports.newProject = function(req, res) {
    if (req.user.status < 3) {
        console.log(req.header('Referer'));
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    res.render('newProject', { title: 'Nytt prosjekt', user: req.user });
}

exports.postNewProject = function(req, res) {
    if (req.user.status < 3) {
        console.log(req.header('Referer'));
        if (req.header('Referer') === undefined) { return res.status(403).render('error', { title: 403, text: 'Du har ikke tilgang til denne siden. Du må registrere deg først. Sjekk mailen din for å se invitekode.' }); }
        else { return res.redirect('back'); }
    }

    var project = new Project(req.body);
    project.user = req.user._id;
    project.save(function(err) {
        if (err) {
            console.log(err.errors);
            return res.render('newproject', { title: 'Nytt prosjekt - en feil oppstod', user: req.user, errors: err.errors, project: project });
        }
        var access = new Access();
        access.user = req.user._id;
        access.creator = req.user._id;
        access.project = project._id;
        access.permissions = 9;
        access.save(function(err) {
            if (err) {
                console.log(err.errors);
                return res.render('newproject', { title: 'Nytt prosjekt - en feil oppstod', user: req.user });
            }
            return res.redirect('/dashboard');
        });
    });

}

