
/**
 * Module dependencies
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var AccessSchema = new Schema({
    user: { type: String, ref: 'User' },
    creator: { type: String, ref: 'User' },
    project: { type: String, ref: 'Project' },
    permissions: { type: Number, default: '3' },
    created: { type: Date, default: Date.now },
    updated: { type: Date, default: Date.now }
});

// the four validations below only apply if you are signing up traditionally

ProjectSchema.methods = {

    log: function() {
        console.log('wat. wat logged this');
    }

}

mongoose.model('Access', AccessSchema);
