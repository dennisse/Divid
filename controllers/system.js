
/**
 * Module dependencies
 */
var mongoose = require('mongoose')
  , Project = mongoose.model('Project');




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




/**
 * After the user has logged in
 * ===============================================================
*/



exports.dashboard = function(req, res) {
    console.log('/dashboard - ' + req.user);

    Project.find(function(err, projects) {
        if (err) return res.render('500');
        console.log(projects);
        res.render('dashboard', {
            title: 'Dashboad',
            loggedin: true,
            projects: projects
        });
    });
}



exports.project = function(req, res) {
    res.render('project', { title: 'Harepus', loggedin: true });
}

exports.newProject = function(req, res) {
    res.render('newproject', { title: 'Nytt prosjekt', loggedin: true });
}

exports.postNewProject = function(req, res) {
    var project = new Project(req.body);
    project.save(function(err) {
        if (err) {
            console.log(err.errors);
            return res.render('newproject', { title: 'Nytt prosjekt - en feil oppstod', loggedin: true, errors: err.errors, project: project });
        }
        return res.redirect('/dashboard');
    });
}

