const mongoose = require('mongoose');
const FKHelper = require('../helper/foreign-key-constraint');
var uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const storeproductSchema = new Schema({
   product_id: { 
       type: Schema.Types.ObjectId, 
       ref:'Product', 
       required: true,
       validate: {
          validator: function(v) {
                return FKHelper(mongoose.model('Product'), v);
            },
            message: `Product doesn't exist`
        } 
    },
    store_id: { 
        type: Schema.Types.ObjectId, 
        ref:'Store', 
        required: true,
        validate: {
           validator: function(v) {
                 return FKHelper(mongoose.model('Store'), v);
             },
             message: `Store doesn't exist`
         } 
     },
   user_id: { 
    type: Schema.Types.ObjectId, 
    ref:'User', 
    validate: {
       validator: function(v) {
             return FKHelper(mongoose.model('User'), v);
         },
         message: `User doesn't exist`
     } 
    },
    price:{ 
       type: Number,
       required: true 
    }
 
}, {timestamps:true});
  storeproductSchema.plugin(uniqueValidator)

module.exports = mongoose.model('Storeproduct', storeproductSchema);
