const mongoose = require('mongoose');
const FKHelper = require('../helper/foreign-key-constraint');

const Schema = mongoose.Schema;

const carddetailSchema = new Schema({
  _user: {
    type: Schema.Types.ObjectId,
    ref:'User',
    required: true,
    validate: {
      validator: function(v) {
              return FKHelper(mongoose.model('User'), v);
          },
        message: `User doesn't exist`
      }
    
  },
  payment_id:{
   type:String,
   required:true
  }
  
}, {timestamps:true});


module.exports = mongoose.model('carddetail', carddetailSchema);
