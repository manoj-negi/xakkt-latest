const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dealSchema = Schema({
  name: {
    type: String,
    required: true
  },
  _store:{
      type: Schema.Types.ObjectId,
      ref:'Store'
  },
  description: {
    type: String,
    default: null
  },
  
}, {timestamps:true});

module.exports = mongoose.model('Deal', dealSchema);
