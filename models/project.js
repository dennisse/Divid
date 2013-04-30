
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var ProjectSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    name: { type: String, default: '', trim: true },
    description: {type: String, default: '', trim: true },
    currency: { type: String, default: 'kr', trim: true },
    public: { type: String, default: 'invite-only' },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});

// the four validations below only apply if you are signing up traditionally

ProjectSchema.path('name').validate(function(name) {
    // if you're authenticated by any of the oauth strategies (facebook, twitter), don't validate
    return name.length;
}, 'Project name cannot be blank');

ProjectSchema.statics = {

    log: function() {
        console.log('wat. wat logged this');
    },



   /**
    * Find project by id
    *
    * @param {ObjectId} id
    * @param {Function} callback
    * @api private
    */

    load: function(id, callback) {
        this.findOne({ _id: id })
          .populate('user')
          .exec(callback);
    }


}

mongoose.model('Project', ProjectSchema);
