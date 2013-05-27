
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var pPostSchema = new Schema({
    user:           { type: Schema.ObjectId, ref: 'User' }
  , for:            { type: Schema.ObjectId, ref: 'User' }
  , project:        { type: Schema.ObjectId, ref: 'Project' }
  , what:           { type: String, default: '', trim: true }
  , comment:        { type: String, default: '', trim: true }
  , participants:   []
  , value:          { type: Number, default: 0 }
  , file:           { type: String, default: '', trim: true }
  , currency:       { type: String, default: 'kr', trim: true }
  , created:        { type: Date, default: Date.now }
  , updated:        { type: Date, default: Date.now }
  , when:           { type: Date, default: Date.now }
});




pPostSchema.statics = {

   /**
    * Find post by id
    *
    * @param {ObjectId} id
    * @param {Function} callback
    */

    load: function(id, callback) {
        this.findOne({ _id: id })
          .populate({ path: 'user', select: '_id, name'}) // include name of the user who posted it
          .exec(callback);
    },


          /**
    * Find all posts that belong to a project, by project id
    *
    * @param {ObjectId} project
    * @param {Function} callback
    */

    loadProject: function(project, callback) {
        this.find({ project: project })
          .populate({ path: 'user', select: '_id, name'})
          .sort({ 'when': -1, 'created': -1 })
          .exec(callback);
    },


   /**
    * Find all posts that belongs to projects provided in an array
    *
    * @param {Array[ObjectId]} projects
    * @param {Function} callback
    */

    loadByProjects: function(projects, callback) {
        this.find({ project: { $in: projects } })
          .populate({ path: 'user', select: '_id name' })
          .populate({ path: 'project', select: 'name shortURL' })
          .sort({ 'when': -1, 'created': -1 })
          .exec(callback);
    }

}

mongoose.model('pPost', pPostSchema);
