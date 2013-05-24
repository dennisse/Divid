
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
    user: { type: Schema.ObjectId, ref: 'User' },
    creator: { type: Schema.ObjectId, ref: 'User' },
    project: { type: Schema.ObjectId, ref: 'Project' },
    permissions: { type: Number, default: '3' },
    randomToken: { type: String },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});


// the four validations below only apply if you are signing up traditionally

AccessSchema.statics = {

   /**
    * Load ALL accesses for a single user
    *
    * @param {ObjectId} id
    * @param {Function} callback
    * @api private
    */

    loadUser: function(id, callback) {
        this.find({ user: id })
          .populate('project')
          .sort({ 'created': -1 }) // sort by date
          .exec(callback);
    },


   /**
    * Load all users associated with a project
    *
    * @param {ObjectId} project
    * @param {Function} callback
    * @api private
    */

    loadProject: function(project, callback) {
        this.find({ project: project })
          .populate('user')
          .sort({ 'created': 1 }) // sort by date
          .exec(callback);
    },


   /**
    * Load all users associated with several projects
    *
    * @param {Arrau[ObjectId]} projects
    * @param {Function} callback
    * @api private
    */

    loadProjects: function(projects, callback) {
        this.find({ project: { $in: projects } })
          .populate({ path: 'user', select: 'name email status' })
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
    * @api private
    */

    checkAccess: function(user, project, permissions, callback) {
        if (typeof(permissions) === 'undefined') permissions = 0;
        console.log('inni checkPermissions!')
        this.findOne({ user: user })
          .where('project').equals(project)
          .where('permissions').gte(permissions)
          .exec(callback);
    }

}

mongoose.model('Access', AccessSchema);
