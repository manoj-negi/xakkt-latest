const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
const FKHelper = require('../helper/foreign-key-constraint');

const Schema = mongoose.Schema;

const shippingSchema = new Schema({
    _store:{
        type: Schema.Types.ObjectId,
        ref: 'Store',
        validate: {
          validator: function(v) {
                return FKHelper(mongoose.model('Store'), v);
            },
            message: `Store doesn't exist`
        } 
      },
      _zone:{
        type: Schema.Types.ObjectId,
        ref: 'shippingZone',
        validate: {
          validator: function(v) {
                return FKHelper(mongoose.model('shippingZone'), v);
            },
            message: `shippingZone doesn't exist`
        } 
      },
  cost:{
    type: String,
    // require:true
  },
  distance:{
      type: String,
    //  required: true
  },
  
}, {timestamps:true});

shippingSchema.plugin(uniqueValidator)
module.exports = mongoose.model('shipping', shippingSchema);
