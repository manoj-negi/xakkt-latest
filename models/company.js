const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');
const FKHelper = require('../helper/foreign-key-constraint');

const companySchema = Schema({
  name: {
    type: String,
    unique:true,
    required: true
  },
  description: {
    type: String,
    default: null
  },
  email: {
    type: String,
    unique:true,
    required:true
  },
  contact: {
    type: String,
  },
  address: {
    type: String,
    default: null
  },
  _store: [
    {
      type: Schema.Types.ObjectId, 
      ref:'Store', 
      required: true,
      validate: {
         validator: function(v) {
               return FKHelper(mongoose.model('Store'), v);
           },
           message: `Store doesn't exist`
       }  
    },

  ],
}, {timestamps:true});
companySchema.plugin(uniqueValidator)

module.exports = mongoose.model('Company', companySchema);
