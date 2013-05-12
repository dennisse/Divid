
/**
 * Module dependencies
 */
var mongoose = require('mongoose')
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
    var projectId = req.sanitize('project').escape();

    // error when validation fails
    var errors = req.validationErrors();
    if (errors) return res.status(500).render('error', { title: '500', text: 'Det oppstod en valideringsfeil', error: errors.stack });


    Access.findOne({ user: req.user._id }).where('project').equals(projectId).exec(function(err, access) {
        if (err || !access) return res.status(403).render('error', { title: '403', text: 'no sir.' });

        // Time to fill in the model!
        var ppost = new pPost();
        ppost.user = req.user._id;
      console.log('ppost.user = ' + req.user._id);

        ppost.for = req.user._id;

        ppost.project = req.sanitize('project').escape(); // escape will escape html-specific characters, like " & > etc."
      console.log('ppost.project = ' + ppost.project);

        ppost.what = req.sanitize('what').escape();
      console.log('ppost.what = ' + ppost.what);

        ppost.comment = req.sanitize('comment').xss(); // xss will remove cross-site-scripting in the textfield.

        ppost.participants = req.sanitize('participants').escape();
      console.log('ppost.participants = ' + ppost.participants);

        ppost.value = req.sanitize('value').toInt(); // this will remove leading zeroes. '0123' => '123'

        ppost.when = new Date(req.sanitize('date').escape() + ' ' + req.sanitize('time').escape() + ':00');
      console.log('ppost.when = ' + ppost.when);

        console.log('req.profile: ' + req.profile);
        ppost.save(function(err) {
            if (err) {
                console.log(err.errors);
                res.render('projectPost', { title: 'Legg til utgift - en feil oppstod', loggedin: true, req: req, project: project });
            }
            return res.redirect('/dashboard');
        })
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

