const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deviceSchema = Schema({
  // device_id: {
  //   type: String,
  //   required: true,
  // },
  user_id: {
      type: Schema.Types.ObjectId, ref: 'User'
  },
  device_type: {
    type: String,
    required: true
  },
  device_token:{
    type: String,
    required: true
  },
  // wuidq:{
  //   type: String,
  //   required: true
  // }
}, {timestamps:true});

module.exports = mongoose.model('Device', deviceSchema);
