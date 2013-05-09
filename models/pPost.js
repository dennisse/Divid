
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
    updated: { type: Date, default: Date.now }
});


pPostSchema.path('what').validate(function(name) {
    return what.length;
}, 'You need to name the expense');




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
          .populate('user')
          .exec(callback);
    }


}

mongoose.model('pPost', pPostSchema);
