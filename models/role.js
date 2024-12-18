const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

let rolesSchema = Schema({
    name    : { type: String, required: true, unique:true },
    description : { type: String, defualt: null},
    key : { type: String, defualt: null},
    _permission : [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Permission',
            // required: true,
            validate: {
             validator: function(v) {
                     return FKHelper(mongoose.model('Permission'), v);
                 },
               message: `Permission doesn't exist`
             }
         }
    ]
  },{
    timestamps: true
  });

  rolesSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Role', rolesSchema);
