const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
const Schema = mongoose.Schema;

const shippingzoneSchema = new Schema({
  name:{
      type: Map,
      of: String,
      require:true
  },
  start_zone:{
    type: String,
    require:true
  },
  end_zone:{
      type: String,
     required: true
  },
  
}, {timestamps:true});

shippingzoneSchema.plugin(uniqueValidator)
module.exports = mongoose.model('shippingZone', shippingzoneSchema);
