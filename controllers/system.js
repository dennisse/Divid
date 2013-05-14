
/**
 * Module dependencies
 */
var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../config/config.js')[env]
  , Project = mongoose.model('Project')
  , Access = mongoose.model('Access')
  , User = mongoose.model('User')
  , pPost = mongoose.model('pPost');

/**
 * Before the user log in
 * ===============================================================
*/

exports.index = function(req, res) {
    res.render('index', { title: 'DERS' });
    };



exports.test = function(req, res) {
    res.render('test', {
        title: 'test',
        loggedin: false
    });
};


exports.home = function(req, res) {
    res.render('home', {
        title: 'home',
        loggedin: false
    });
};


exports.faq = function(req, res) {
    res.render('faq', {
        title: 'faq',
        loggedin: false
    });
}


exports.contact = function(req, res) {
    res.render('contact', {
        title: 'contact',
        loggedin: false
    });
}


/**
 * After the user has logged in
 * ===============================================================
*/



exports.dashboard = function(req, res) {
    console.log('/dashboard - ' + req.user._id);

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
    Access.loadUser(req.user._id, function(err, projects) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        Project.populate(projects, { path: 'project.user', model: User }, function(err, projects) {

            console.log('accesses: ' + projects);

            res.render('dashboard', {
                title: 'Dashboard',
                loggedin: true,
                projects: projects
            });

        });

    });

/*
    Project.find(function(err, projects) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        res.render('dashboard', {
            title: 'Dashboad',
            loggedin: true,
            projects: projects
        });
    });*/
}



exports.project = function(req, res) {
    Project.loadShort(req.params.short, function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

        res.render('project', { title: 'Harepus', loggedin: true, req: req, project: project });

    });
}

exports.projectParticipants = function(req, res) {

    res.render('projectParticipants', { title: 'Prosjektdeltakere', loggedin: true });

}

exports.postProjectParticipants = function(req, res) {
    var email = require('emailjs');

    var server = email.server.connect(config.email);
    console.log(server);

    var message = {
        text:       'lol',
        from:       'Divid <divid@divid.no>',
        to:         'dennis.se@gmail.com',
        subject:    'test'
    }

    server.send(message, function(err, message) { console.log(err || message);});

    res.redirect('back');
}

exports.projectPost = function(req, res) {

   /** ###################################
    * Need to check if user has access to this project!!
    */
    console.log(req.loggedin);
    Project.loadShort(req.params.short, function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });
        req.project = project;
        res.render('projectPost', { title: 'Legg til utgift', loggedin: true, req: req, project: project });
    });



}

exports.postProjectPost = function(req, res) {

    // Validation
    req.assert('project', 'The project was lost').notEmpty();
    req.assert('what', 'You need to fill in the what-field').notEmpty();
    req.assert('value', 'The value must be a positive number').notEmpty().isInt().min(0);

    // error when validation fails
    var errors = req.validationErrors();
    if (errors) return res.status(500).render('error', { title: '500', text: 'Det oppstod en valideringsfeil', error: errors.stack });

    Project.load(req.sanitize('project').escape(), function(err, project) {
        if (err) return res.status(500).render('error', { title: '500', text: 'En serverfeil oppstod', error: err.stack });

        // check if access
        Access.checkAccess(req.user._id, project._id, function(err, access) {
            if (err || !access) return res.status(403).render('error', { title: '403', text: 'no sir.' });

            // Time to fill in the model!
            var ppost = new pPost();

            ppost.user         = req.user._id;
            ppost.for          = req.user._id;
            ppost.project      = project._id;
            ppost.what         = req.sanitize('what').escape();
            ppost.comment      = req.sanitize('comment').xss(); // xss will remove cross-site-scripting in the textfield.
            ppost.participants = req.sanitize('participants').escape();
            ppost.value        = req.sanitize('value').toInt(); // this will remove leading zeroes. '0123' => '123'
            ppost.when         = new Date(req.sanitize('date').escape() + ' ' + req.sanitize('time').escape() + ':00');

            ppost.save(function(err) {
                if (err) {
                    console.log(err.errors);
                    res.render('projectPost', { title: 'Legg til utgift - en feil oppstod', loggedin: true, req: req, project: project });
                }
                return res.redirect('/project/' + project.shortURL);
            })
        });
    });
}
exports.newProject = function(req, res) {
    res.render('newProject', { title: 'Nytt prosjekt', loggedin: true });
}

exports.postNewProject = function(req, res) {
    var project = new Project(req.body);
    project.user = req.user._id;
    project.save(function(err) {
        if (err) {
            console.log(err.errors);
            return res.render('newproject', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true, errors: err.errors, project: project });
        }
        var access = new Access();
        access.user = req.user._id;
        access.creator = req.user._id;
        access.project = project._id;
        access.permissions = 1;
        access.save(function(err) {
            if (err) {
                console.log(err.errors);
                return res.render('newproject', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true });
            }
            return res.redirect('/dashboard');
        });
    });

}

