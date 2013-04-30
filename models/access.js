
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var AccessSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    creator: { type: Schema.ObjectId, ref: 'User' },
    project: { type: Schema.ObjectId, ref: 'Project' },
    permissions: { type: Number, default: '3' },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});

// the four validations below only apply if you are signing up traditionally

AccessSchema.statics = {

    log: function() {
        console.log('wat. wat logged this');
    },

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
    }
}

mongoose.model('Access', AccessSchema);
