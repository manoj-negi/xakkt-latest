const mongoose = require('mongoose');
const mongooseLeanGetters = require('mongoose-lean-getters')
const FKHelper = require('../helper/foreign-key-constraint');
const Schema = mongoose.Schema;
const productRegularPricingSchema = new Schema({ 
     _product: {
        type: Schema.Types.ObjectId,
        ref:'Product',
        required:true,
        validate: {
                validator: function(v) {
                return FKHelper(mongoose.model('Product'), v);
          },
        message: `Product doesn't exist`
      }
    
    },
    _user: {
        type: Schema.Types.ObjectId,
        ref:'User',
        required:true,
        validate: {
                validator: function(v) {
                return FKHelper(mongoose.model('User'), v);
             },
            message: `User doesn't exist`
        }
    },
    _store: {
        type: Schema.Types.ObjectId,
        ref:'Store',
        required:true,
        validate: {
                validator: function(v) {
                return FKHelper(mongoose.model('Store'), v);
             },
            message: `Store doesn't exist`
        }
    },
    product_status: {
        type: String,
        enum: ['Active','Inactive'],
    },
    regular_price: {
        type: mongoose.Decimal128,
        get: function(value) {
            return value.toString();
        },
        required: true
    },
 },{timestamps:true});

 productRegularPricingSchema.plugin(mongooseLeanGetters)
 
module.exports = mongoose.model('ProductRegularPricing', productRegularPricingSchema);