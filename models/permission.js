const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

let permissionSchema = Schema({
    name : { type: String, required: true, unique:true },
    type : { type: String },
    description : { type: String, defualt: null},
    _roles : [
        { 
            type: Schema.Types.ObjectId, 
            ref: 'Role',
            // required: true,
            validate: {
             validator: function(v) {
                     return FKHelper(mongoose.model('Role'), v);
                 },
               message: `Role doesn't exist`
             }
         }
    ]
  },{
    timestamps: true
  });

  permissionSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Permission', permissionSchema);
