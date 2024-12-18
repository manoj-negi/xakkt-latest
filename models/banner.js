const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const FKHelper = require('../helper/foreign-key-constraint');

const bannerSchema = Schema({
  image: {
     type: String,
  },
  _store: {
    type: Schema.Types.ObjectId,
    ref:'Store',
    required:false,
    validate: {
            validator: function(v) {
            return FKHelper(mongoose.model('Store'), v);
         },
        message: `Store doesn't exist`
    }
},
  _deal: {
    type: Schema.Types.ObjectId,
    ref:'Deal',
    required:false,
    validate: {
            validator: function(v) {
            return FKHelper(mongoose.model('Deal'), v);
         },
        message: `Deal doesn't exist`
    }
},
type: {
  type: String,
  enum: ['app', 'web'],
  default : 'app' 
  }
  // deal_start:{
  //   type:Date,
  //   required:true
  //  },
  //  deal_end:{
  //      type:Date,
  //      required:true
  //  }
  
}, {timestamps:true});


module.exports = mongoose.model('Banner', bannerSchema);
