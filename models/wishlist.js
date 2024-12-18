const mongoose = require('mongoose');
const FKHelper = require('../helper/foreign-key-constraint');

const Schema = mongoose.Schema;

const wishlistSchema = new Schema({
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
  _product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    validate: {
      validator: function(v) {
              return FKHelper(mongoose.model('Product'), v);
          },
        message: `Product doesn't exist`
      }
  },
  _store: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required:true,
    validate: {
      validator: function(v) {
              return FKHelper(mongoose.model('Store'), v);
          },
        message: `Store doesn't exist`
      }
  },
  wish_price:{
      type: Number,
      require:true
  },
  valid_till: {
    type: Date,
    
  },
}, {timestamps:true});

wishlistSchema.index({
  _user: 1,
  _product: 1,
  _store:1
}, {
  unique: true,
});


module.exports = mongoose.model('Wishlist', wishlistSchema);
