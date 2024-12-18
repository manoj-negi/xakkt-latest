const mongoose = require('mongoose');
const FKHelper = require('../helper/foreign-key-constraint');
const Schema = mongoose.Schema;
const mongooseLeanGetters = require('mongoose-lean-getters')

const storeProductPricingSchema = new Schema({ 
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
    _deal: {
        type: Schema.Types.ObjectId,
        ref:'Deal',
        required:true,
        validate: {
                validator: function(v) {
                return FKHelper(mongoose.model('Deal'), v);
             },
            message: `Deal doesn't exist`
        }
    },
    deal_percentage: {
        type: Number,
    },
    deal_price: {
        type: mongoose.Decimal128,
        get: function(value) {
            return value.toString();
        },        
    },
    _country: {
        type: Schema.Types.ObjectId,
        ref:'Country',
        validate: {
                validator: function(v) {
                return FKHelper(mongoose.model('Country'), v);
             },
            message: `Country doesn't exist`
        }
    },
    deal_start:{
     type:Date,
     required:true
    },
    deal_end:{
        type:Date,
        required:true
    }
 },{timestamps:true});

 storeProductPricingSchema.plugin(mongooseLeanGetters)
//  storeProductPricingSchema.index({
//     _store: 1,
//     _product: 1
//   }, {
//     unique: true,
//   });

module.exports = mongoose.model('StoreProductPricing', storeProductPricingSchema);