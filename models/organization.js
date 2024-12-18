const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizationSchema = Schema({
  name: {
      type: String,
      required: true
  },
  status: {
    type: Boolean,
    default: true
  },
  address:{
    type: String,
    required: true
  }
}, {timestamps:true});

module.exports = mongoose.model('organizations', OrganizationSchema);
