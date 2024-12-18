const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const brandSchema = Schema({
  name: {
    type: String,
    required: true
  },
  brand_id: {
    type: String,
    required: false
  },
  description: {
    type: String,
    default: null
  },
  logo: {
      type: String,
      required: false
    },
  status: {
      type: Boolean,
      default: true
  }

}, {timestamps:true});

module.exports = mongoose.model('Brand', brandSchema);
