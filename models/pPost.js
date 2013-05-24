
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var pPostSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    for: { type: Schema.ObjectId, ref: 'User' },
    project: { type: Schema.ObjectId, ref: 'Project' },
    what: { type: String, default: '', trim: true },
    comment: { type: String, default: '', trim: true },
    participants: [],
    value: { type: Number, defailt: 0 },
    file: { type: String, default: '', trim: true },
    currency: { type: String, default: 'kr', trim: true },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now },
    when: { type: Date, default: Date.now }
});




pPostSchema.statics = {

   /**
    * Find post by id
    *
    * @param {ObjectId} id
    * @param {Function} callback
    * @api private
    */

    load: function(id, callback) {
        this.findOne({ _id: id })
          .populate({ path: 'user', select: '_id, name'})
          .exec(callback);
    },


          /**
    * Find all posts that belong to a project, by project id
    *
    * @param {ObjectId} project
    * @param {Function} callback
    * @api private
    */

    loadProject: function(project, callback) {
        this.find({ project: project })
          .populate('user')
          .sort({ 'when': -1, 'created': -1 })
          .exec(callback);
    },


   /**
    * Find last ten posts belonging projects a user is part of, by project ids
    *
    * @param {Array[ObjectId]} projects
    * @param {Function} callback
    * @api private
    */

    loadByProjects: function(projects, callback) {
        this.find({ project: { $in: projects } })
          .populate({ path: 'user', select: 'name email status' })
          .populate({ path: 'project', select: 'name shortURL' })
          .limit(10)
          .sort({ 'when': -1, 'created': -1 })
          .exec(callback);
    }

}

mongoose.model('pPost', pPostSchema);
