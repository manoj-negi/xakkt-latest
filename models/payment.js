const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const FKHelper = require('../helper/foreign-key-constraint');
var uniqueValidator = require('mongoose-unique-validator');

const paymentSchema = Schema({
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
  transation_id: {
    type: String,
    required: false
  },
  total_ammount: {
    type: String,
    default: null
  },
  refund_ammount: {
    type: String,
    default: null
  },
  _order:{
    type: Schema.Types.ObjectId,
    ref:'orders',
    required: true,
    validate: {
      validator: function(v) {
              return FKHelper(mongoose.model('orders'), v);
          },
        message: `order doesn't exist`
      }
  },
  method:{
    type:String,
    enum: ['NetBanking','Stripe','Cash on Delivery'],
    required: true
  },
  status:  { 
    type: String,
    enum: ['pending','recieved','dispatched','cancelled','delivered','refunded','disputed' ],
    required: true
  },

}, {timestamps:true});

paymentSchema.plugin(uniqueValidator)
module.exports = mongoose.model('Payment', paymentSchema);
