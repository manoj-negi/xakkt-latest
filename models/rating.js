const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const FKHelper = require('../helper/foreign-key-constraint');
var uniqueValidator = require('mongoose-unique-validator');

const RateSchema = Schema({
  _user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    validate: {
      validator: function (v) {
        return FKHelper(mongoose.model('User'), v);
      },
      message: `User doesn't exist`
    }
  },
  rating: {
    type: Number
  },
  _product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    validate: {
      validator: function (v) {
        return FKHelper(mongoose.model('Product'), v);
      },
      message: `Product doesn't exist`
    }

  },


}, { timestamps: true });

RateSchema.plugin(uniqueValidator)
module.exports = mongoose.model('Rating', RateSchema);



