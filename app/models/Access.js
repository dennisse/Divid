
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;


/**
 * Schema
 *
 * Permissions:
 * 3 = normal
 * 6 = admin
 * 9 = owner
 * These permissions are set in steps of three, in case
 * we need to add more permissions later.
 */

var AccessSchema = new Schema({
    user:           { type: Schema.ObjectId, ref: 'User' }
  , creator:        { type: Schema.ObjectId, ref: 'User' }
  , project:        { type: Schema.ObjectId, ref: 'Project' }
  , permissions:    { type: Number, default: '3' }
  , randomToken:    String
  , created:        { type: Date, default: Date.now }
  , updated:        { type: Date, default: Date.now }
});


// the four validations below only apply if you are signing up traditionally

AccessSchema.methods = {

    /**
    * Generate random access token for Remember Me function
    *
    * @param {Number} length
    * @return {String}
    */

    generateRandomToken: function(length) {
        if (typeof(length) === undefined) length = 16; // default length of token
        var chars = '_-abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
          , token = '';
        for (var i = 0; i < length; i++) {
            var x = Math.floor(Math.random() * chars.length);
            token += chars.charAt(x);
        }
        return token;
    }

}

AccessSchema.statics = {

   /**
    * Load ALL accesses for a single user
    * This will load all the persmissions a user has, and include info about the projects
    *
    * @param {ObjectId} id
    * @param {Function} callback
    */

    loadUser: function(id, callback) {
        this.find({ user: id })
          .populate('project') // will joins the data from the project
          .sort({ 'created': -1 }) // sort by date
          .exec(callback);
    },


   /**
    * Load all users associated with a project
    *
    * @param {ObjectId} project
    * @param {Function} callback
    */

    loadProject: function(project, callback) {
        this.find({ project: project })
          .populate({path: 'user', select: '_id name'})
          .sort({ 'created': 1 }) // sort by date
          .exec(callback);
    },


   /**
    * Load all users associated with several projects
    * This is useful for the dashboard, where all the projects of a user is loaded. This way
    * we can print the name of the participants in each project the user has access to.
    *
    * @param {Array[ObjectId]} projects
    * @param {Function} callback
    */

    loadProjects: function(projects, callback) {
        this.find({ project: { $in: projects } })
          .populate({ path: 'user', select: '_id name' })
          .sort({ 'created': -1 })
          .exec(callback);
    },


   /**
    * Check to see if user has access to a particular project
    *
    * @param {ObjectId} user
    * @param {ObjectId} project
    * @param {Number} permissisons
    * @param {Function} callback
    */

    checkAccess: function(user, project, permissions, callback) {
        if (typeof(permissions) === 'undefined') permissions = 0;
        this.findOne({ user: user })
          .where('project').equals(project)
          .where('permissions').gte(permissions)
          .exec(callback);
    }

}

mongoose.model('Access', AccessSchema);
