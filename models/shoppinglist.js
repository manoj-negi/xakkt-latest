const mongoose = require('mongoose');
const FKHelper = require('../helper/foreign-key-constraint');

const Schema = mongoose.Schema;

const shoppingSchema = new Schema({
   _shoppinglist: { 
       type: Schema.Types.ObjectId, 
       ref:'ShoppinglistName', 
       required: true,
       validate: {
          validator: function(v) {
                return FKHelper(mongoose.model('ShoppinglistName'), v);
            },
            message: `Shoppinglist doesn't exist`
        } 
    },
   _user: { 
       type: Schema.Types.ObjectId, 
       ref:'User',
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
   quantity:{ 
       type: Number,
       required: true 
    }
 
}, {timestamps:true});

shoppingSchema.index({
    _shoppinglist: 1,
    _product: 1
  }, {
    unique: true,
  });

module.exports = mongoose.model('Shoppinglist', shoppingSchema);
